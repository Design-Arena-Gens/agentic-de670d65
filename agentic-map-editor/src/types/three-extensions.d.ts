declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Loader } from "three";
  export class GLTFLoader extends Loader {
    constructor();
    loadAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<any>;
  }
}

declare module "three/examples/jsm/loaders/OBJLoader" {
  import { Loader, Object3D } from "three";
  export class OBJLoader extends Loader {
    constructor();
    loadAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<Object3D>;
  }
}
