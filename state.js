// ─── TRAVIO — État partagé entre tous les modules ───

export const BACKEND = 'http://localhost:3000';

export let currentUser    = null;
export let agenceData     = null;
export let uploadedLogo   = null;
export let uploadedPhotos = [];
export let currentStep    = 1;
export let pdvList        = [];
export let resaList       = [];
export let resaListFiltree = [];
export let trajetList     = [];
export let busSteps       = {};
export let departSteps    = {};
export let vehiculeList   = [];
export let departsCache    = {};
export let allDepartsCache = null;

// Variables liées à l'édition des images d'agence
export let editNewLogo        = null;
export let editPhotosToDelete = [];
export let editPhotosToAdd    = [];

// ── Setters ──
// En JS, on ne peut pas réassigner une variable "let" importée directement
// depuis un autre module. Il faut donc passer par des fonctions pour
// modifier ces valeurs depuis les autres fichiers.

export function setCurrentUser(val)     { currentUser = val; }
export function setAgenceData(val)      { agenceData = val; }
export function setUploadedLogo(val)    { uploadedLogo = val; }
export function setUploadedPhotos(val)  { uploadedPhotos = val; }
export function setCurrentStep(val)     { currentStep = val; }
export function setPdvList(val)         { pdvList = val; }
export function setResaList(val)        { resaList = val; }
export function setResaListFiltree(val) { resaListFiltree = val; }
export function setTrajetList(val)      { trajetList = val; }
export function setBusSteps(val)        { busSteps = val; }
export function setDepartSteps(val)     { departSteps = val; }
export function setVehiculeList(val)    { vehiculeList = val; }
export function setDepartsCache(val)    { departsCache = val; }
export function setAllDepartsCache(val) { allDepartsCache = val; }
export function setEditNewLogo(val)        { editNewLogo = val; }
export function setEditPhotosToDelete(val) { editPhotosToDelete = val; }
export function setEditPhotosToAdd(val)    { editPhotosToAdd = val; }