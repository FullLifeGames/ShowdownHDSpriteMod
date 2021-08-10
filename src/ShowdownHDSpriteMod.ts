// ==UserScript==
// @name         ShowdownHDSpriteMod
// @namespace    https://fulllifegames.com/Tools/ShowdownHDSpriteMod
// @description  This script aims to ease battling on Pokemon Showdown.
// @author       FullLifeGames
// @include      http://play.pokemonshowdown.com/
// @include      https://play.pokemonshowdown.com/
// @include      http://play.pokemonshowdown.com/*
// @include      https://play.pokemonshowdown.com/*
// @include      http://replay.pokemonshowdown.com/
// @include      https://replay.pokemonshowdown.com/
// @include      http://replay.pokemonshowdown.com/*
// @include      https://replay.pokemonshowdown.com/*
// @include      http://*.psim.us/
// @include      https://*.psim.us/
// @include      http://*.psim.us/*
// @include      https://*.psim.us/*
// @version      1.0.3
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  const corsAnyWhereImpl = 'https://cors-anywhere-hd.herokuapp.com/';

  const currentQueriedList = new Map<string, { querying: boolean }>();

  const resultList = new Map<string, { exists: boolean }>();

  // Check the README for usage
  const furretTurretPath = 'http://localhost:8080/';

  const hdImagePaths = [
    furretTurretPath + 'HDFront&BackSprites/',
    furretTurretPath + 'FurretTurret_REGULAR_HD_SPRITE_GEN1/',
    furretTurretPath + 'Gen_2/',
    furretTurretPath + 'Gen_3/',
    furretTurretPath + 'Gen_4/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN1/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN2/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN3/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN4/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN5/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN6/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN7/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_ULTRA/',
    furretTurretPath + 'Gen_8_Shiny/',
    'https://www.pkparaiso.com/imagenes/espada_escudo/sprites/animados-gigante/',
    'https://www.pkparaiso.com/imagenes/ultra_sol_ultra_luna/sprites/animados-sinbordes-gigante/',
    // TODO: Find alternative HD image hosters (e.g. the FurretTurret Sprites)
  ];

  function makeRequest(method: string, url: string): Promise<XMLHttpRequest> | null {
    if (currentQueriedList.get(url)?.querying) return null;
    return new Promise(function (resolve, reject) {
      currentQueriedList.set(url, { querying: true });
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        currentQueriedList.delete(url);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject(xhr);
        }
      };
      xhr.onerror = function () {
        currentQueriedList.delete(url);
        reject(xhr);
      };
      xhr.send();
    });
  }

  async function urlExists(url: string) {
    try {
      const corsFreeUrl = corsAnyWhereImpl + url;
      const response = await makeRequest(
        'HEAD',
        url.indexOf('file:///') === -1 && url.indexOf('localhost') === -1 ? corsFreeUrl : url
      );
      if (response === null) {
        return null;
      }
      return response.status !== 404;
    } catch {
      return null;
    }
  }

  function getMonsName(monsGif: string) {
    let monsName = monsGif.substring(0, monsGif.lastIndexOf('.'));
    if (monsName.indexOf('-') !== -1) {
      monsName = monsName.substring(0, monsName.indexOf('-'));
    }
    return [monsName, monsGif.substring(monsName.length)];
  }

  async function checkAndSetHdImage(pokemonImage: HTMLImageElement, monsGif: string) {
    const monsGifs = hdImagePaths.map(
      (hdImagePath) =>
        hdImagePath +
        (hdImagePath.indexOf(furretTurretPath) !== -1 ? monsGif.replace('-', '') : monsGif)
    );
    for (let fullMonsGif of monsGifs) {
      if (resultList.has(fullMonsGif)) {
        if (resultList.get(fullMonsGif)?.exists) {
          if (
            pokemonImage.src !== fullMonsGif &&
            (pokemonImage.src.indexOf('pokemonshowdown') !== -1 ||
              pokemonImage.src.indexOf('psim.us') !== -1)
          ) {
            pokemonImage.src = fullMonsGif;
          }
          break;
        }
        continue;
      }
      try {
        let exists = await urlExists(fullMonsGif);
        if (exists === null || !exists) {
          const [monsName, extension] = getMonsName(monsGif);
          const pokeDexNumber = window.exports.BattlePokedex[monsName].num;
          const hostUrl = fullMonsGif.substring(0, fullMonsGif.lastIndexOf('/') + 1);
          const oldFullMonsGif = fullMonsGif;
          fullMonsGif = hostUrl + pokeDexNumber + extension;
          exists = await urlExists(fullMonsGif);
          if (exists === null || !exists) {
            resultList.set(oldFullMonsGif, { exists: false });
          }
        }
        if (exists !== null) {
          if (exists) {
            if (
              pokemonImage.src !== fullMonsGif &&
              (pokemonImage.src.indexOf('pokemonshowdown') !== -1 ||
                pokemonImage.src.indexOf('psim.us') !== -1)
            ) {
              pokemonImage.src = fullMonsGif;
            }
            resultList.set(fullMonsGif, { exists: true });
            break;
          } else {
            resultList.set(fullMonsGif, { exists: false });
          }
        }
      } catch {
        resultList.set(fullMonsGif, { exists: false });
      }
    }
  }

  function logic() {
    const pokemonImages = $('div.battle img:not(.pixelated)');

    for (let i = 0; i < pokemonImages.length; i++) {
      const pokemonImage = pokemonImages[i] as HTMLImageElement;
      if (!hdImagePaths.some((hdImagePath) => pokemonImage.src.indexOf(hdImagePath) !== -1)) {
        if (pokemonImage.src.indexOf('sprites/ani/') !== -1) {
          const monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani/') + 'sprites/ani/'.length
          );
          checkAndSetHdImage(pokemonImage, monsGif);
        } else if (pokemonImage.src.indexOf('sprites/ani-back/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-back/') + 'sprites/ani-back/'.length
          );
          monsGif = monsGif.replace('.gif', '-back.gif');
          checkAndSetHdImage(pokemonImage, monsGif);
        } else if (pokemonImage.src.indexOf('sprites/ani-shiny/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-shiny/') + 'sprites/ani-shiny/'.length
          );
          monsGif = monsGif.replace('.gif', '-s.gif');
          checkAndSetHdImage(pokemonImage, monsGif);
        } else if (pokemonImage.src.indexOf('sprites/ani-back-shiny/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-back-shiny/') + 'sprites/ani-back-shiny/'.length
          );
          monsGif = monsGif.replace('.gif', '-back-s.gif');
          checkAndSetHdImage(pokemonImage, monsGif);
        }
      }
    }

    setTimeout(logic, 500);
  }

  setTimeout(logic, 500);
})();
