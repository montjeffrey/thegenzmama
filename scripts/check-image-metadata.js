// Fails if any image under public/ carries GPS location metadata.
//
// Photos taken on a phone embed the location they were taken at. Everything under
// public/ is served byte for byte (and the repo is public), so a photo of the
// children with its GPS block intact tells anyone who downloads it where it was
// taken. Strip metadata before committing, e.g. with sharp (a Next.js dependency):
//   sharp(file).rotate().keepIccProfile().toFile(out)
// `.rotate()` bakes any EXIF orientation into the pixels, so dropping the tag does
// not turn the picture sideways. Coordinates are never printed by this script.
//
// Usage: node scripts/check-image-metadata.js [dir ...]   (default: public)

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|avif|tiff?)$/i;
const XMP_GPS = /GPSLatitude|GPSLongitude|exif:GPS/;
const GPS_IFD_TAG = 0x8825;

// True if the TIFF structure starting at `base` has a GPS IFD pointer in IFD0.
// Throws RangeError when the structure runs past the buffer.
function tiffHasGps(buf, base) {
    const sig = buf.toString('latin1', base, base + 2);
    const le = sig === 'II';
    if (!le && sig !== 'MM') return false;
    const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
    const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
    if (u16(base + 2) !== 42) return false;
    const ifd0 = base + u32(base + 4);
    const count = u16(ifd0);
    for (let i = 0; i < count; i++) {
        if (u16(ifd0 + 2 + i * 12) === GPS_IFD_TAG) return true;
    }
    return false;
}

// JPEG: walk the marker segments up to the image data.
function jpegFindings(buf) {
    const found = [];
    let p = 2;
    while (p + 4 <= buf.length && buf[p] === 0xff) {
        const marker = buf[p + 1];
        if (marker === 0xda || marker === 0xd9) break; // start of scan / end of image
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
            p += 2;
            continue;
        }
        const end = p + 2 + buf.readUInt16BE(p + 2);
        if (marker === 0xe1) {
            const body = buf.subarray(p + 4, end);
            if (body.toString('latin1', 0, 6) === 'Exif\0\0') {
                try {
                    if (tiffHasGps(buf, p + 10)) found.push('EXIF GPS block');
                } catch {
                    found.push('unreadable EXIF block (cannot rule out GPS)');
                }
            } else if (XMP_GPS.test(body.toString('latin1'))) {
                found.push('XMP GPS properties');
            }
        }
        p = end;
    }
    return found;
}

// PNG, WebP, HEIC, TIFF and anything else: look for embedded TIFF/Exif blocks
// and XMP text anywhere in the file. A false match needs a valid TIFF header
// whose IFD0 holds the GPS tag, so this does not flag ordinary pixel data.
function scanFindings(buf) {
    const found = [];
    for (const sig of ['II*\0', 'MM\0*']) {
        let at = buf.indexOf(sig, 0, 'latin1');
        while (at !== -1) {
            try {
                if (tiffHasGps(buf, at)) {
                    found.push('EXIF GPS block');
                    break;
                }
            } catch {
                // not a real TIFF structure; keep scanning
            }
            at = buf.indexOf(sig, at + 1, 'latin1');
        }
    }
    if (XMP_GPS.test(buf.toString('latin1'))) found.push('XMP GPS properties');
    return found;
}

// Returns a list of problems; empty when the buffer has no GPS metadata.
function findGps(buf) {
    const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
    return isJpeg ? jpegFindings(buf) : scanFindings(buf);
}

function listImages(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listImages(full));
        else if (IMAGE_EXT.test(entry.name)) out.push(full);
    }
    return out;
}

function main(dirs) {
    let bad = 0;
    let checked = 0;
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const file of listImages(dir)) {
            checked++;
            const problems = findGps(fs.readFileSync(file));
            if (problems.length) {
                bad++;
                console.error(`${file.split(path.sep).join('/')}: ${problems.join(', ')}`);
            }
        }
    }
    if (bad) {
        console.error(
            `\n${bad} image(s) contain GPS location metadata. Strip it before committing, e.g.\n` +
                `  node -e "require('sharp')('IN.jpeg').rotate().keepIccProfile().jpeg({quality:92}).toFile('OUT.jpeg')"`
        );
        process.exit(1);
    }
    console.log(`Image metadata check passed: ${checked} image(s), no GPS metadata.`);
}

module.exports = { findGps };

if (require.main === module) {
    const args = process.argv.slice(2);
    main(args.length ? args : ['public']);
}
