import { AsyncLocalStorage as _ALS } from "node:async_hooks";
import _process from "node:process";
import _buffer from "node:buffer";
import _events from "node:events";
import _util from "node:util";
import _stream from "node:stream";
import _path from "node:path";
import _fs from "node:fs";
import _url from "node:url";
import _crypto from "node:crypto";
import _http from "node:http";
import _https from "node:https";
import _zlib from "node:zlib";

globalThis.AsyncLocalStorage = _ALS;
globalThis.process = _process;
globalThis.Buffer = _buffer.Buffer;

export const require = (id) => {
    const nid = id.replace(/^node:/, "");
    if (nid === "async_hooks") return { AsyncLocalStorage: _ALS };
    if (nid === "process") return _process;
    if (nid === "buffer") return _buffer;
    if (nid === "events") return _events;
    if (nid === "util") return _util;
    if (nid === "stream") return _stream;
    if (nid === "path") return _path;
    if (nid === "fs") return _fs;
    if (nid === "url") return _url;
    if (nid === "crypto") return _crypto;
    if (nid === "http") return _http;
    if (nid === "https") return _https;
    if (nid === "zlib") return _zlib;
    return {};
};
