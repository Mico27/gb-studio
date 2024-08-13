import Path from "path";
import {
  ActorResource,
  AvatarResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResource,
  EmoteResource,
  EngineFieldValuesResource,
  FontResource,
  MusicResource,
  PaletteResource,
  ScriptResource,
  SettingsResource,
  SoundResource,
  SpriteResource,
  TilesetResource,
  TriggerResource,
  VariablesResource,
  WriteFile,
} from "shared/lib/resources/types";
import {
  getActorResourcePath,
  getPaletteResourcePath,
  getResourceAssetPath,
  getSceneFolderPath,
  getSceneResourcePath,
  getScriptResourcePath,
  getTriggerResourcePath,
} from "shared/lib/resources/paths";
import SparkMD5 from "spark-md5";
import { omit } from "shared/types";

export const encodeResource = <T extends Record<string, unknown>>(
  resourceType: string,
  data: T
): string => {
  const {
    // Extract id so it can be moved to top of data
    id,
    // Remove internal data so it isn't stored to disk
    __type,
    // Extract remaining data to write to disk
    ...rest
  } = data;
  return JSON.stringify(
    {
      _resourceType: resourceType,
      id,
      ...rest,
    },
    null,
    2
  );
};

export const buildResourceExportBuffer = (
  projectResources: CompressedProjectResources
): WriteFile[] => {
  const projectPartsFolder = "project";
  const variablesResFilename = Path.join(`variables.gbsres`);
  const settingsResFilename = Path.join(`settings.gbsres`);
  const userSettingsResFilename = Path.join(`user_settings.gbsres`);
  const engineFieldValuesResFilename = Path.join(`engine_field_values.gbsres`);

  const writeBuffer: WriteFile[] = [];

  const seenPaths = new Set<string>();

  const getUniquePath = (path: string): string => {
    if (!seenPaths.has(path)) {
      seenPaths.add(path);
      return path;
    }
    const basename = Path.basename(path);
    const dirname = Path.dirname(path);
    const newPath = Path.join(
      dirname,
      basename.replace(
        /([0-9]*)(\.[^.]+|)$/,
        (_, number, ext) => `${number ? parseInt(number) + 1 : `_2`}${ext}`
      )
    );
    return getUniquePath(newPath);
  };

  const writeResource = <T extends Record<string, unknown>>(
    filename: string,
    resourceType: string,
    resource: T
  ) => {
    const filePath = Path.join(projectPartsFolder, filename);
    const data = encodeResource(resourceType, resource);
    writeBuffer.push({
      path: filePath,
      checksum: SparkMD5.hash(data),
      data,
    });
  };

  for (const scene of projectResources.scenes) {
    const sceneFolder = getUniquePath(getSceneFolderPath(scene));
    const sceneFilename = getUniquePath(getSceneResourcePath(sceneFolder));
    // Scene Actors
    if (scene.actors.length > 0) {
      let actorIndex = 0;
      for (const actor of scene.actors) {
        if (actor) {
          const actorFilename = getUniquePath(
            getActorResourcePath(sceneFolder, actor)
          );
          writeResource<ActorResource>(actorFilename, "actor", {
            ...actor,
            _index: actorIndex,
          });
          actorIndex++;
        }
      }
    }
    // Scene Triggers
    if (scene.triggers.length > 0) {
      let triggerIndex = 0;
      for (const trigger of scene.triggers) {
        if (trigger) {
          const triggerFilename = getUniquePath(
            getTriggerResourcePath(sceneFolder, trigger)
          );
          writeResource<TriggerResource>(triggerFilename, "trigger", {
            ...trigger,
            _index: triggerIndex,
          });
          triggerIndex++;
        }
      }
    }

    writeResource<CompressedSceneResource>(
      sceneFilename,
      "scene",
      omit(scene, "actors", "triggers")
    );
  }

  for (const background of projectResources.backgrounds) {
    const backgroundFilename = getUniquePath(getResourceAssetPath(background));
    writeResource<CompressedBackgroundResource>(
      backgroundFilename,
      "background",
      background
    );
  }

  for (const sprite of projectResources.sprites) {
    const spriteFilename = getUniquePath(getResourceAssetPath(sprite));
    writeResource<SpriteResource>(spriteFilename, "sprite", sprite);
  }

  for (const palette of projectResources.palettes) {
    const paletteFilename = getUniquePath(getPaletteResourcePath(palette));
    writeResource<PaletteResource>(paletteFilename, "palette", palette);
  }

  for (const script of projectResources.scripts) {
    const scriptFilename = getUniquePath(getScriptResourcePath(script));
    writeResource<ScriptResource>(scriptFilename, "script", script);
  }

  for (const song of projectResources.music) {
    const songFilename = getUniquePath(getResourceAssetPath(song));
    writeResource<MusicResource>(songFilename, "music", song);
  }

  for (const sound of projectResources.sounds) {
    const soundFilename = getUniquePath(getResourceAssetPath(sound));
    writeResource<SoundResource>(soundFilename, "sound", sound);
  }

  for (const emote of projectResources.emotes) {
    const emoteFilename = getUniquePath(getResourceAssetPath(emote));
    writeResource<EmoteResource>(emoteFilename, "emote", emote);
  }

  for (const avatar of projectResources.avatars) {
    const avatarFilename = getUniquePath(getResourceAssetPath(avatar));
    writeResource<AvatarResource>(avatarFilename, "avatar", avatar);
  }

  for (const tileset of projectResources.tilesets) {
    const tilesetFilename = getUniquePath(getResourceAssetPath(tileset));
    writeResource<TilesetResource>(tilesetFilename, "tileset", tileset);
  }

  for (const font of projectResources.fonts) {
    const fontFilename = getUniquePath(getResourceAssetPath(font));
    writeResource<FontResource>(fontFilename, "font", font);
  }

  writeResource<Partial<SettingsResource>>(settingsResFilename, "settings", {
    ...projectResources.settings,
    worldScrollX: undefined,
    worldScrollY: undefined,
    zoom: undefined,
  });

  writeResource<Partial<SettingsResource>>(
    userSettingsResFilename,
    "settings",
    {
      worldScrollX: projectResources.settings.worldScrollX,
      worldScrollY: projectResources.settings.worldScrollY,
      zoom: projectResources.settings.zoom,
    }
  );

  writeResource<VariablesResource>(
    variablesResFilename,
    "variables",
    projectResources.variables
  );

  writeResource<EngineFieldValuesResource>(
    engineFieldValuesResFilename,
    "engineFieldValues",
    projectResources.engineFieldValues
  );

  return writeBuffer;
};
