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
// @version      1.2.0
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  const corsAnyWhereImpl = 'https://cors-anywhere-hd.herokuapp.com/';

  const currentQueriedList = new Map<string, { querying: boolean }>();

  const resultList = new Map<string, { exists: boolean }>();

  const animatedSmallSprites = true;

  // Check the README for usage
  const furretTurretPath = 'http://localhost:8080/';

  const hdImagePaths = [
    furretTurretPath + 'HDFront&BackSpritesCropped/',
    furretTurretPath + 'FurretTurret_REGULAR_HD_SPRITE_GEN1/',
    furretTurretPath + 'Gen_2/',
    furretTurretPath + 'Gen_3/',
    furretTurretPath + 'Gen_4/',
    'https://www.pkparaiso.com/imagenes/espada_escudo/sprites/animados-gigante/',
    'https://www.pkparaiso.com/imagenes/ultra_sol_ultra_luna/sprites/animados-sinbordes-gigante/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN1/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN2/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN3/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN4/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN5/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN6/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_GEN7/',
    furretTurretPath + 'FurretTurret_SHINY_HD_SPRITE_ULTRA/',
    furretTurretPath + 'Gen_8_Shiny/',
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

  function setHdImageSrc(pokemonImage: HTMLImageElement, fullMonsGif: string) {
    if (
      pokemonImage.src !== fullMonsGif &&
      (pokemonImage.src.indexOf('pokemonshowdown') !== -1 ||
        pokemonImage.src.indexOf('psim.us') !== -1)
    ) {
      pokemonImage.src = fullMonsGif;
      pokemonImage.style.objectFit = 'contain';
    }
  }

  function setHdImageStyle(miniPokemonImage: HTMLSpanElement, fullMonsGif: string) {
    if (
      miniPokemonImage.style.background !== `url(${fullMonsGif})` &&
      (miniPokemonImage.style.background.indexOf('pokemonshowdown') !== -1 ||
        miniPokemonImage.style.background.indexOf('psim.us') !== -1)
    ) {
      miniPokemonImage.style.background = `url(${fullMonsGif})`;
      miniPokemonImage.style.backgroundSize = 'contain';
      miniPokemonImage.style.backgroundPosition = 'center';
      miniPokemonImage.style.backgroundRepeat = 'no-repeat';
    }
  }

  async function checkAndSetHdImage<HTMLElementImpl>(
    pokemonImage: HTMLElementImpl,
    monsGif: string,
    setImage: (pokemonImage: HTMLElementImpl, fullMonsGif: string) => void
  ) {
    const monsGifs = hdImagePaths.map(
      (hdImagePath) =>
        hdImagePath +
        (hdImagePath.indexOf(furretTurretPath) !== -1 ? monsGif.replace('-', '') : monsGif)
    );
    for (let fullMonsGif of monsGifs) {
      if (resultList.has(fullMonsGif)) {
        if (resultList.get(fullMonsGif)?.exists) {
          setImage(pokemonImage, fullMonsGif);
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
            setImage(pokemonImage, fullMonsGif);
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
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani/') + 'sprites/ani/'.length
          );
          monsGif = monsGif.replace('-f', '');
          checkAndSetHdImage(pokemonImage, monsGif, setHdImageSrc);
        } else if (pokemonImage.src.indexOf('sprites/ani-back/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-back/') + 'sprites/ani-back/'.length
          );
          monsGif = monsGif.replace('.gif', '-back.gif');
          monsGif = monsGif.replace('-f', '');
          checkAndSetHdImage(pokemonImage, monsGif, setHdImageSrc);
        } else if (pokemonImage.src.indexOf('sprites/ani-shiny/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-shiny/') + 'sprites/ani-shiny/'.length
          );
          monsGif = monsGif.replace('.gif', '-s.gif');
          monsGif = monsGif.replace('-f', '');
          checkAndSetHdImage(pokemonImage, monsGif, setHdImageSrc);
        } else if (pokemonImage.src.indexOf('sprites/ani-back-shiny/') !== -1) {
          let monsGif = pokemonImage.src.substr(
            pokemonImage.src.indexOf('sprites/ani-back-shiny/') + 'sprites/ani-back-shiny/'.length
          );
          monsGif = monsGif.replace('.gif', '-back-s.gif');
          monsGif = monsGif.replace('-f', '');
          checkAndSetHdImage(pokemonImage, monsGif, setHdImageSrc);
        }
      }
    }

    if (animatedSmallSprites) {
      const miniPokemonImages = $('.picon.has-tooltip');
      for (let i = 0; i < miniPokemonImages.length; i++) {
        const miniPokemonImage = miniPokemonImages[i] as HTMLSpanElement;
        if (
          !hdImagePaths.some(
            (hdImagePath) => miniPokemonImage.style.background.indexOf(hdImagePath) !== -1
          )
        ) {
          let pokemonName = miniPokemonImage.attributes.getNamedItem('aria-label')?.value;

          if (pokemonName !== undefined) {
            pokemonName = pokemonName.toLowerCase();

            pokemonName = pokemonName.replace(' (active)', '');
            pokemonName = pokemonName.replace(' (fainted)', '');
            pokemonName = pokemonName.replace(' (tox)', '');
            pokemonName = pokemonName.replace(' (brn)', '');
            pokemonName = pokemonName.replace(' (par)', '');
            pokemonName = pokemonName.replace(' (frz)', '');

            if (pokemonName.indexOf('%') !== -1) {
              for (const seperation of pokemonName.split('(')) {
                if (seperation.indexOf('%') !== -1) {
                  pokemonName = pokemonName.replace(
                    '(' + seperation.substr(0, seperation.indexOf(')') + 1),
                    ''
                  );
                  break;
                }
              }
            }

            if (pokemonName.indexOf('(') !== -1) {
              pokemonName = pokemonName.substr(pokemonName.indexOf('(') + 1);
              pokemonName = pokemonName.substr(0, pokemonName.indexOf(')'));
            }

            pokemonName = pokemonName.trim();

            checkAndSetHdImage(miniPokemonImage, `${pokemonName}.gif`, setHdImageStyle);
          }
        }
      }
    }

    setTimeout(logic, 500);
  }

  setTimeout(logic, 500);
})();
