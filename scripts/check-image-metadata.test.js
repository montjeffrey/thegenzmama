const test = require('node:test');
const assert = require('node:assert');
const { findGps } = require('./check-image-metadata');

// Minimal little-endian TIFF with one IFD0 entry of the given tag.
function tiff(tag) {
    const b = Buffer.alloc(8 + 2 + 12 + 4);
    b.write('II', 0, 'latin1');
    b.writeUInt16LE(42, 2);
    b.writeUInt32LE(8, 4);
    b.writeUInt16LE(1, 8);
    b.writeUInt16LE(tag, 10);
    return b;
}

// SOI + one APP1 segment + EOI.
function jpeg(app1Body) {
    const len = Buffer.alloc(2);
    len.writeUInt16BE(app1Body.length + 2);
    return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), len, app1Body, Buffer.from([0xff, 0xd9])]);
}

const exif = (tag) => Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff(tag)]);

test('JPEG with a GPS IFD pointer is flagged', () => {
    assert.deepStrictEqual(findGps(jpeg(exif(0x8825))), ['EXIF GPS block']);
});

test('JPEG with EXIF but no GPS passes', () => {
    assert.deepStrictEqual(findGps(jpeg(exif(0x0112))), []);
});

test('JPEG with XMP GPS properties is flagged', () => {
    const xmp = Buffer.from('http://ns.adobe.com/xap/1.0/\0<x exif:GPSLatitude="0"/>', 'latin1');
    assert.deepStrictEqual(findGps(jpeg(xmp)), ['XMP GPS properties']);
});

test('JPEG with no metadata passes', () => {
    assert.deepStrictEqual(findGps(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), []);
});

test('non-JPEG containing a GPS TIFF block is flagged', () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), tiff(0x8825)]);
    assert.deepStrictEqual(findGps(png), ['EXIF GPS block']);
});

test('non-JPEG without GPS passes', () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), tiff(0x0112)]);
    assert.deepStrictEqual(findGps(png), []);
});
