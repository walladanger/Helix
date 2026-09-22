//#region node_modules/.nitro/vite/services/ssr/assets/models-1pMUrgZU.js
var MODELS = [{
	id: "grok-4.5",
	label: "Grok 4.5",
	inputPerM: 2,
	outputPerM: 6,
	cachedPerM: .5,
	context: 5e5
}, {
	id: "grok-4.7",
	label: "Grok 4.7",
	inputPerM: 2,
	outputPerM: 6,
	cachedPerM: .5,
	context: 5e5
}];
var DEFAULT_MODEL = "grok-4.5";
function isModelId(value) {
	return MODELS.some((m) => m.id === value);
}
function modelMeta(id) {
	return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
var GPU_PROFILES = [
	{
		id: "h100",
		name: "H100 80GB",
		vramGB: 80,
		tdpW: 700,
		bandwidthTBps: 3.35,
		smCount: 132
	},
	{
		id: "h200",
		name: "H200 141GB",
		vramGB: 141,
		tdpW: 700,
		bandwidthTBps: 4.8,
		smCount: 132
	},
	{
		id: "b200",
		name: "B200 192GB",
		vramGB: 192,
		tdpW: 1e3,
		bandwidthTBps: 8,
		smCount: 148
	},
	{
		id: "a100",
		name: "A100 80GB",
		vramGB: 80,
		tdpW: 400,
		bandwidthTBps: 2.039,
		smCount: 108
	},
	{
		id: "4090",
		name: "RTX 4090 24GB",
		vramGB: 24,
		tdpW: 450,
		bandwidthTBps: 1.008,
		smCount: 128
	},
	{
		id: "5090",
		name: "RTX 5090 32GB",
		vramGB: 32,
		tdpW: 575,
		bandwidthTBps: 1.792,
		smCount: 170
	}
];
function gpuMeta(id) {
	return GPU_PROFILES.find((g) => g.id === id) ?? GPU_PROFILES[0];
}
/**
* Serving-side transformer estimates. Grok internals are not public;
* these are labeled as estimates and used only for KV / VRAM math.
*/
var SERVING_ARCH = {
	nLayers: 64,
	nKvHeads: 8,
	headDim: 128,
	hiddenSize: 8192,
	bytes: 2,
	weightGB: 72,
	label: "Estimated MoE serving profile (GQA)"
};
//#endregion
export { gpuMeta as a, SERVING_ARCH as i, GPU_PROFILES as n, isModelId as o, MODELS as r, modelMeta as s, DEFAULT_MODEL as t };
