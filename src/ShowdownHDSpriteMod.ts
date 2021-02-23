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
// @version      0.0.2
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  const corsAnyWhereImpl = 'https://cors-anywhere-hd.herokuapp.com/';

  const currentQueriedList = new Map<string, { querying: boolean }>();

  const resultList = new Map<string, { exists: boolean }>();

  // Check the README for usage
  const furretTurretPath = "http://localhost:8080/";

  const hdImagePaths = [
    furretTurretPath + "FurretTurret_REGULAR_HD_SPRITE_GEN1/",
    furretTurretPath + "Gen_2/",
    furretTurretPath + "Gen_3/",
    furretTurretPath + "Gen_4/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN1/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN2/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN3/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN4/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN5/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN6/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_GEN7/",
    furretTurretPath + "FurretTurret_SHINY_HD_SPRITE_ULTRA/",
    furretTurretPath + "Gen_8_Shiny/",
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
    const corsFreeUrl = corsAnyWhereImpl + url;
    const response = await makeRequest('HEAD', url.indexOf('file:///') === -1 && url.indexOf('localhost') === -1 ? corsFreeUrl : url);
    if (response === null) {
      return null;
    }
    return response.status !== 404;
  }

  async function checkAndSetHdImage(pokemonImage: HTMLImageElement, monsGif: string) {
    const monsGifs = hdImagePaths.map((hdImagePath) => hdImagePath + monsGif);
    for (const monsGif of monsGifs) {
      if (resultList.has(monsGif)) {
        if (resultList.get(monsGif)?.exists) {
          pokemonImage.src = monsGif;
          break;
        }
        continue;
      }
      try {
        const exists = await urlExists(monsGif);
        if (exists !== null) {
          if (exists) {
            pokemonImage.src = monsGif;
            resultList.set(monsGif, { exists: true });
            break;
          } else {
            resultList.set(monsGif, { exists: false });
          }
        }
      } catch {
        resultList.set(monsGif, { exists: false });
      }
    }
  }

  function logic() {
    const pokemonImages = $('div.battle img:not(.pixelated)');

    for (let i = 0; i < pokemonImages.length; i++) {
      const pokemonImage = pokemonImages[i] as HTMLImageElement;
      if (pokemonImage.src.indexOf('pkparaiso') === -1) {
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
