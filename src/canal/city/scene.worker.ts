import { prepare } from "./prepare";
import { buildScene } from "./scene";

/**
 * Builds the city's markup off the main thread, with what the page reads out
 * of it (lights, the buildings that cover vehicles). It is all plain data, so
 * it crosses to the page by structured clone while the page stays responsive.
 */
const port = self as unknown as { postMessage(data: unknown): void };
const scene = buildScene();
port.postMessage({ scene, prepared: prepare(scene) });
