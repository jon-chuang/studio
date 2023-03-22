// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinitionField } from "@foxglove/message-definition";

// eslint-disable-next-line
// @ts-ignore/
import ModuleFactory from "./a.out.js";
import { MessageDefinitionMap } from "./types";

const ModulePromise = ModuleFactory();

// eslint-disable-next-line
// @ts-ignore
let Module;

function ensureLoaded() {
  // eslint-disable-next-line
  // @ts-ignore
  if (Module == undefined) {
    throw new Error(
      `capnproto-reflection has not finished loading. Please wait with "await isLoaded" before calling any methods`,
    );
  }
}

function parseCapnprotoSchema(
  schemaName: string,
  schemaBin: Uint8Array,
): {
  datatypes: MessageDefinitionMap;
  deserialize: (data: ArrayBufferView) => unknown;
} {
  ensureLoaded();
  // eslint-disable-next-line
  // @ts-ignore
  const transcoder = new Module.CapnpTranscoder(schemaBin);
  transcoder.setSchema(schemaName);
  const deserialize = (data: ArrayBufferView) => {
    return transcoder.transcode(data);
  };
  const datatypes = new Map();
  {
    const fields: MessageDefinitionField[] = [];
    datatypes.set("log.capnp:FrameData", { definitions: fields });
  }
  const fields: MessageDefinitionField[] = [];
  fields.push({
    name: "logMessage",
    type: "string",
  });
  fields.push({
    name: "roadCameraState",
    type: "log.capnp:FrameData",
    isComplex: true,
  });
  datatypes.set("log.capnp:Event", { definitions: fields });
  return {
    datatypes,
    deserialize,
  };
}

// export a promise a consumer can listen to to wait
// for the module to finish loading
// module loading is async and can take
// several hundred milliseconds...accessing the module
// before it is loaded will throw an error

// eslint-disable-next-line
// @ts-ignore
const isLoaded = ModulePromise.then((mod) => mod["ready"].then(() => {}));

// Wait for the promise returned from ModuleFactory to resolve

// eslint-disable-next-line
// @ts-ignore
ModulePromise.then((mod) => {
  Module = mod;
});

export { isLoaded, parseCapnprotoSchema };
