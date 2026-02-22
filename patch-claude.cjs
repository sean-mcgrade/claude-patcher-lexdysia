const LIEF = require('node-lief');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

console.log("Claude Code Color Patcher for Dyslexia Accessibility");
console.log("------------------------------------------------------");

// --- Configuration ---
const CONFIG = {
    userMsgBg: '255,245,210',  // Pastel yellow
    aiMsgBg: '235,245,255',    // Pastel blue
    textColor: '20,20,20',     // Dark grey
    claudeName: '100,50,200'   // Purple name
};

const BUN_TRAILER = Buffer.from('B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0', 'hex');
const SIZEOF_OFFSETS = 32;
const SIZEOF_MODULE_OLD = 36;
const SIZEOF_MODULE_NEW = 52;

function parseStringPointer(buffer, offset) {
    return { offset: buffer.readUInt32LE(offset), length: buffer.readUInt32LE(offset + 4) };
}

function getStringPointerContent(buffer, ptr) {
    if (ptr.length === 0) return Buffer.alloc(0);
    return buffer.subarray(ptr.offset, ptr.offset + ptr.length);
}

function parseOffsets(buffer) {
    let pos = 0;
    return {
        byteCount: buffer.readBigUInt64LE(pos),
        modulesPtr: parseStringPointer(buffer, pos += 8),
        entryPointId: buffer.readUInt32LE(pos += 8),
        compileExecArgvPtr: parseStringPointer(buffer, pos += 4),
        flags: buffer.readUInt32LE(pos += 8)
    };
}

function extractBunDataFromPE(peBinary) {
    const bunSection = peBinary.sections().find(s => s.name === '.bun');
    if (!bunSection) throw new Error('.bun section not found');

    const sectionData = Buffer.from(bunSection.content);
    const bunDataSizeU32 = sectionData.readUInt32LE(0);
    const bunDataSizeU64 = Number(sectionData.readBigUInt64LE(0));

    const useU64 = bunDataSizeU64 + 8 <= sectionData.length && bunDataSizeU64 > bunDataSizeU32;
    const headerSize = useU64 ? 8 : 4;
    const bunDataSize = useU64 ? bunDataSizeU64 : bunDataSizeU32;

    const bunDataContent = sectionData.subarray(headerSize, headerSize + bunDataSize);
    const offsetsBytes = bunDataContent.subarray(bunDataContent.length - SIZEOF_OFFSETS - BUN_TRAILER.length, bunDataContent.length - BUN_TRAILER.length);
    const bunOffsets = parseOffsets(offsetsBytes);
    const moduleStructSize = detectModuleStructSize(bunOffsets.modulesPtr.length);

    return { bunOffsets, bunData: bunDataContent, moduleStructSize, sectionHeaderSize: headerSize };
}

function detectModuleStructSize(len) {
    return len % SIZEOF_MODULE_NEW === 0 ? SIZEOF_MODULE_NEW : SIZEOF_MODULE_OLD;
}

function extractClaudeJs(bunOffsets, bunData, moduleStructSize) {
    const modulesListBytes = getStringPointerContent(bunData, bunOffsets.modulesPtr);
    const modulesCount = Math.floor(modulesListBytes.length / moduleStructSize);

    for (let i = 0; i < modulesCount; i++) {
        const pos = i * moduleStructSize;
        const namePtr = parseStringPointer(modulesListBytes, pos);
        const name = getStringPointerContent(bunData, namePtr).toString('utf-8');

        if (name.endsWith('claude.exe') || name.endsWith('claude')) {
            const contentsPtr = parseStringPointer(modulesListBytes, pos + 8);
            return {
                index: i,
                name,
                content: getStringPointerContent(bunData, contentsPtr).toString('utf-8')
            };
        }
    }
    return null;
}

function applyThemeReplacements(code) {
    let patched = code;

    const switchPattern = /switch\s*\([^)]+\)\s*\{[^}]*case\s*["']light["'][^}]+\}/s;
    if (!patched.match(switchPattern)) {
        console.warn("Theme switch not found. Claude may have changed its build.");
    }

    patched = patched.replace(/"userMessageBackground":"[^"]+"/g, `"userMessageBackground":"rgb(${CONFIG.userMsgBg})"`);
    patched = patched.replace(/"background":"[^"]+"/g, `"background":"rgb(${CONFIG.aiMsgBg})"`);
    patched = patched.replace(/"text":"[^"]+"/g, `"text":"rgb(${CONFIG.textColor})"`);
    patched = patched.replace(/"inverseText":"[^"]+"/g, `"inverseText":"rgb(255,255,255)"`);
    patched = patched.replace(/"claude":"[^"]+"/g, `"claude":"rgb(${CONFIG.claudeName})"`);

    return patched;
}

function rebuildBunData(bunData, bunOffsets, modifiedClaudeJs, moduleIndex, moduleStructSize) {
    const stringsData = [];
    const modulesMetadata = [];

    const modulesListBytes = getStringPointerContent(bunData, bunOffsets.modulesPtr);
    const modulesCount = Math.floor(modulesListBytes.length / moduleStructSize);

    for (let i = 0; i < modulesCount; i++) {
        const pos = i * moduleStructSize;
        let currPos = pos;
        const namePtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;
        const contentsPtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;
        const sourcemapPtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;
        const bytecodePtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;

        let moduleInfoPtr = { offset: 0, length: 0 };
        let bytecodeOriginPathPtr = { offset: 0, length: 0 };

        if (moduleStructSize === SIZEOF_MODULE_NEW) {
            moduleInfoPtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;
            bytecodeOriginPathPtr = parseStringPointer(modulesListBytes, currPos); currPos += 8;
        }

        const encoding = modulesListBytes.readUInt8(currPos++);
        const loader = modulesListBytes.readUInt8(currPos++);
        const moduleFormat = modulesListBytes.readUInt8(currPos++);
        const side = modulesListBytes.readUInt8(currPos++);

        const nameBytes = getStringPointerContent(bunData, namePtr);
        const contentsBytes = (i === moduleIndex) ? Buffer.from(modifiedClaudeJs, 'utf8') : getStringPointerContent(bunData, contentsPtr);
        const sourcemapBytes = getStringPointerContent(bunData, sourcemapPtr);
        const bytecodeBytes = getStringPointerContent(bunData, bytecodePtr);
        const moduleInfoBytes = getStringPointerContent(bunData, moduleInfoPtr);
        const bytecodeOriginPathBytes = getStringPointerContent(bunData, bytecodeOriginPathPtr);

        modulesMetadata.push({
            encoding, loader, moduleFormat, side
        });

        if (moduleStructSize === SIZEOF_MODULE_NEW) {
            stringsData.push(nameBytes, contentsBytes, sourcemapBytes, bytecodeBytes, moduleInfoBytes, bytecodeOriginPathBytes);
        } else {
            stringsData.push(nameBytes, contentsBytes, sourcemapBytes, bytecodeBytes);
        }
    }

    const stringsPerModule = moduleStructSize === SIZEOF_MODULE_NEW ? 6 : 4;
    let currentOffset = 0;
    const stringOffsets = [];

    for (const strData of stringsData) {
        stringOffsets.push({ offset: currentOffset, length: strData.length });
        currentOffset += strData.length + 1; // null terminator
    }

    const modulesListOffset = currentOffset;
    const modulesListSize = modulesMetadata.length * moduleStructSize;
    currentOffset += modulesListSize;

    const compileExecArgvBytes = getStringPointerContent(bunData, bunOffsets.compileExecArgvPtr);
    const compileExecArgvOffset = currentOffset;
    const compileExecArgvLength = compileExecArgvBytes.length;
    currentOffset += compileExecArgvLength + 1;

    const offsetsOffset = currentOffset;
    currentOffset += SIZEOF_OFFSETS;

    const trailerOffset = currentOffset;
    currentOffset += BUN_TRAILER.length;

    const newBuffer = Buffer.alloc(currentOffset, 0);

    let stringIdx = 0;
    for (const { offset, length } of stringOffsets) {
        if (length > 0) {
            stringsData[stringIdx].copy(newBuffer, offset, 0, length);
        }
        newBuffer[offset + length] = 0;
        stringIdx++;
    }

    if (compileExecArgvLength > 0) {
        compileExecArgvBytes.copy(newBuffer, compileExecArgvOffset, 0, compileExecArgvLength);
        newBuffer[compileExecArgvOffset + compileExecArgvLength] = 0; // null terminator
    }

    for (let i = 0; i < modulesMetadata.length; i++) {
        const meta = modulesMetadata[i];
        const baseStrIdx = i * stringsPerModule;
        let pos = modulesListOffset + (i * moduleStructSize);

        function writeStrPtr(strPtr) {
            newBuffer.writeUInt32LE(strPtr.offset, pos);
            newBuffer.writeUInt32LE(strPtr.length, pos + 4);
            pos += 8;
        }

        writeStrPtr(stringOffsets[baseStrIdx]);
        writeStrPtr(stringOffsets[baseStrIdx + 1]);
        writeStrPtr(stringOffsets[baseStrIdx + 2]);
        writeStrPtr(stringOffsets[baseStrIdx + 3]);

        if (moduleStructSize === SIZEOF_MODULE_NEW) {
            writeStrPtr(stringOffsets[baseStrIdx + 4]);
            writeStrPtr(stringOffsets[baseStrIdx + 5]);
        }

        newBuffer.writeUInt8(meta.encoding, pos++);
        newBuffer.writeUInt8(meta.loader, pos++);
        newBuffer.writeUInt8(meta.moduleFormat, pos++);
        newBuffer.writeUInt8(meta.side, pos++);
    }

    let offsetsPos = offsetsOffset;
    newBuffer.writeBigUInt64LE(BigInt(offsetsOffset), offsetsPos); offsetsPos += 8;
    newBuffer.writeUInt32LE(modulesListOffset, offsetsPos);
    newBuffer.writeUInt32LE(modulesListSize, offsetsPos + 4); offsetsPos += 8;
    newBuffer.writeUInt32LE(bunOffsets.entryPointId, offsetsPos); offsetsPos += 4;
    newBuffer.writeUInt32LE(compileExecArgvOffset, offsetsPos);
    newBuffer.writeUInt32LE(compileExecArgvLength, offsetsPos + 4); offsetsPos += 8;
    newBuffer.writeUInt32LE(bunOffsets.flags, offsetsPos);

    BUN_TRAILER.copy(newBuffer, trailerOffset);

    return newBuffer;
}

function run() {
    const binaryPath = path.join(process.env.USERPROFILE, '.local', 'bin', 'claude.exe');

    if (!fs.existsSync(binaryPath)) {
        console.error(`Claude executable not found at ${binaryPath}.`);
        process.exit(1);
    }

    console.log(`Parsing Claude binary at ${binaryPath}...`);
    LIEF.logging.disable();
    let binary = LIEF.parse(binaryPath);

    const { bunOffsets, bunData, moduleStructSize, sectionHeaderSize } = extractBunDataFromPE(binary);

    const extracted = extractClaudeJs(bunOffsets, bunData, moduleStructSize);
    if (!extracted) {
        console.error("Failed to find claude payload.");
        process.exit(1);
    }

    console.log("Applying color patches to text UI...");
    const patchedJs = applyThemeReplacements(extracted.content);
    if (patchedJs === extracted.content) {
        console.log("No color changes made. Code may already be patched.");
        process.exit(0);
    }

    console.log("Repacking executable...");
    const newBunData = rebuildBunData(bunData, bunOffsets, patchedJs, extracted.index, moduleStructSize);

    const sectionData = Buffer.alloc(sectionHeaderSize + newBunData.length);
    if (sectionHeaderSize === 8) {
        sectionData.writeBigUInt64LE(BigInt(newBunData.length), 0);
    } else {
        sectionData.writeUInt32LE(newBunData.length, 0);
    }
    newBunData.copy(sectionData, sectionHeaderSize);

    binary.sections().find(s => s.name === '.bun').content = Array.from(sectionData);

    const backupPath = binaryPath + '.bak';
    if (!fs.existsSync(backupPath)) {
        console.log("Creating backup...");
        fs.copyFileSync(binaryPath, backupPath);
    }

    try {
        const outPath = binaryPath + '.tmp';
        binary.write(outPath);
        // Explicitly copy permissions or attributes if needed, else rename
        fs.renameSync(outPath, binaryPath);
        console.log("✅ Success! Custom background colors applied.");
    } catch (e) {
        console.error("Failed to save binary. Is Claude currently running?", e.message);
    }
}

try {
    run();
} catch (e) {
    console.error("Error:", e);
}
