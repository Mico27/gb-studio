import {
  ActorResource,
  CompressedSceneResourceWithChildren,
  PaletteResource,
  Resource,
  ScriptResource,
  TriggerResource,
} from "shared/lib/resources/types";
import Path from "path";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";

type Entity = { id: string; name: string };

const entityToFilePath = (entity: Entity, fallbackName: string): string => {
  return (
    `${stripInvalidPathCharacters(entity.name || "")
      .toLocaleLowerCase()
      .replace(/\\/g, "/")
      .replace(/\s+/g, "_")}` || fallbackName
  );
};

const actorToFileName = (actor: Entity): string => {
  return entityToFilePath(actor, "actor").replace(/[/\\]/g, "_");
};

const triggerToFileName = (trigger: Entity): string => {
  return entityToFilePath(trigger, "trigger").replace(/[/\\]/g, "_");
};

const resourceTypeFolderLookup = {
  background: "backgrounds",
  sprite: "sprites",
  tileset: "tilesets",
  emote: "emotes",
  avatar: "avatars",
  music: "music",
  sound: "sounds",
  font: "fonts",
  palette: "palettes",
  script: "scripts",
  scene: "scenes",
  actor: "actors",
  trigger: "triggers",
};

export const getResourceAssetPath = (resource: Resource): string =>
  Path.join(
    resourceTypeFolderLookup[resource._resourceType],
    `${entityToFilePath(resource, "asset")}.gbsres`
  );

export const getSceneFolderPath = (
  scene: CompressedSceneResourceWithChildren
): string =>
  Path.join(
    resourceTypeFolderLookup[scene._resourceType],
    `${entityToFilePath(scene, "scene")}`
  );

export const getSceneResourcePath = (sceneFolder: string): string =>
  Path.join(sceneFolder, `scene.gbsres`);

export const getActorResourcePath = (
  sceneFolder: string,
  actor: ActorResource
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[actor._resourceType],
    `${actorToFileName(actor)}.gbsres`
  );

export const curryActorResourcePath =
  (sceneFolder: string) =>
  (actor: ActorResource): string =>
    getActorResourcePath(sceneFolder, actor);

export const getTriggerResourcePath = (
  sceneFolder: string,
  trigger: TriggerResource
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[trigger._resourceType],
    `${triggerToFileName(trigger)}.gbsres`
  );

export const curryTriggerResourcePath =
  (sceneFolder: string) =>
  (actor: TriggerResource): string =>
    getTriggerResourcePath(sceneFolder, actor);

export const getSceneResourcePaths = (
  scene: CompressedSceneResourceWithChildren
): string[] => {
  const sceneFolder = getSceneFolderPath(scene);
  const getActorPath = curryActorResourcePath(sceneFolder);
  const getTriggerPath = curryTriggerResourcePath(sceneFolder);
  return [
    getSceneResourcePath(sceneFolder),
    scene.actors.map(getActorPath),
    scene.triggers.map(getTriggerPath),
  ].flat();
};

export const getPaletteResourcePath = (palette: PaletteResource) =>
  Path.join(
    resourceTypeFolderLookup[palette._resourceType],
    `${entityToFilePath(palette, "palette")}.gbsres`
  );

export const getScriptResourcePath = (script: ScriptResource) =>
  Path.join(
    resourceTypeFolderLookup[script._resourceType],
    `${entityToFilePath(script, "script")}.gbsres`
  );
