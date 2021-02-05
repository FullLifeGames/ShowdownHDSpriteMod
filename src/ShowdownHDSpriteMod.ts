// ==UserScript==
// @name         ShowdownHDSpriteMod
// @namespace    https://fulllifegames.com/Tools/ShowdownHDSpriteMod
// @description  This script aims to ease battling on Pokemon Showdown.
// @author       FullLifeGames
// @include      http://play.pokemonshowdown.com/
// @include      https://play.pokemonshowdown.com/
// @include      http://play.pokemonshowdown.com/*
// @include      https://play.pokemonshowdown.com/*
// @include      http://*.psim.us/
// @include      https://*.psim.us/
// @include      http://*.psim.us/*
// @include      https://*.psim.us/*
// @version      0.0.1
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  let lastOwnPokemon: string;
  let lastOppPokemon: string;
  let lastWeatherStatus: string | null;
  let lastTerrainStatus: string | null;

  const weatherMapping = {
    sunnyday: 'Sun',
    raindance: 'Rain',
    sandstorm: 'Sand',
    hail: 'Hail',
    harshsunshine: 'Harsh Sunshine',
    heavyrain: 'Heavy Rain',
    strongwinds: 'Strong Winds',
  };

  const terrainMapping = {
    grassyterrain: 'Grassy',
    psychicterrain: 'Psychic',
    electricterrain: 'Electric',
    mistyterrain: 'Misty',
  };

  let running = false;

  let runningHandlerId: string;

  let currentId: string;
  let currentClickedBattleOptions: HTMLElement;

  let currentTier: string;

  function currentIdExists() {
    return $('#' + currentId).length > 0;
  }

  function getActiveWeatherStats(
    psRoom: JQuery<HTMLElement>,
    weather: Array<string>
  ): string | null {
    for (let index = 0; index < weather.length; index++) {
      const element = weather[index];
      if (psRoom.find('.' + element + 'weather').length > 0) {
        return element;
      }
    }
    return null;
  }

  function getActivePokemon(littleImages: JQuery<HTMLElement>): string | null {
    let activePokemon = null as string | null;
    littleImages.each(function () {
      const label = $(this).attr('aria-label') as string;
      if (label.indexOf('(active)') !== -1) {
        activePokemon = label.replace(' (active)', '');
        if (activePokemon.indexOf('(') !== -1) {
          activePokemon = activePokemon.substr(activePokemon.indexOf('(') + 1);
          activePokemon = activePokemon.substr(0, activePokemon.indexOf(')'));
        }
      }
    });
    return activePokemon;
  }

  function handleDamageCalcs() {
    // Cycle stop conditions
    if (!running) {
      return;
    }

    if (runningHandlerId !== currentId) {
      runningHandlerId = currentId;
      return;
    }
    if (!currentIdExists()) {
      return;
    }
    runningHandlerId = currentId;

    const psRoom = $(currentClickedBattleOptions).closest('.ps-room');

    const currentWeatherStatus = getActiveWeatherStats(psRoom, Object.keys(weatherMapping));
    const currentTerrainStatus = getActiveWeatherStats(psRoom, Object.keys(terrainMapping));

    const currentOwnPokemon = getActivePokemon($(psRoom.find('.leftbar .picon.has-tooltip')));
    if (currentOwnPokemon !== null) {
      const currentOppPokemon = getActivePokemon($(psRoom.find('.rightbar .picon.has-tooltip')));
      if (currentOppPokemon !== null) {
        if (
          currentOwnPokemon !== lastOwnPokemon ||
          currentOppPokemon !== lastOppPokemon ||
          currentWeatherStatus !== lastWeatherStatus ||
          currentTerrainStatus !== lastTerrainStatus
        ) {
          lastOwnPokemon = currentOwnPokemon;
          lastOppPokemon = currentOppPokemon;
          lastWeatherStatus = currentWeatherStatus;
          lastTerrainStatus = currentTerrainStatus;

          const calcs =
            '<iframe class="calcIframe" style="width: 100%; height: 30em;" sandbox="allow-same-origin allow-scripts allow-forms" src="https://fulllifegames.com/Tools/CalcApi/?ownPokemon=' +
            currentOwnPokemon +
            '&oppPokemon=' +
            currentOppPokemon +
            '&weather=' +
            (currentWeatherStatus !== null ? (weatherMapping as any)[currentWeatherStatus] : null) +
            '&terrain=' +
            (currentTerrainStatus !== null ? (terrainMapping as any)[currentTerrainStatus] : null) +
            '&tier=' +
            currentTier +
            '" />';
          $(currentClickedBattleOptions)
            .closest('.battle-log')
            .children('.inner.message-log')
            .append($('<div class="chat calc" style="white-space: pre-line">' + calcs + '</div>'));
        }
      }
    }
    // check if new damagecalcs are needed
    setTimeout(handleDamageCalcs, 500);
  }

  function triggerBattleHelp() {
    console.log('BattleHelper triggered');

    $("[name='close']").trigger('click');
    $(currentClickedBattleOptions)
      .closest('.battle-log')
      .children('.inner.message-log')
      .append(
        $(
          '<div class="chat battleHelperScouter" style="white-space: pre-line">Loading ReplayScouter ...</div>'
        )
      );
    $(currentClickedBattleOptions)
      .closest('.battle-log')
      .children('.inner.message-log')
      .append(
        $(
          '<div class="chat battleHelperDump" style="white-space: pre-line">Loading SmogonDump ...</div>'
        )
      );

    const psRoom = $(currentClickedBattleOptions).closest('.ps-room');

    const id = psRoom.attr('id') as string;
    currentId = id;
    runningHandlerId = currentId;

    const oppName = $(psRoom.find('.battle div > div.rightbar > div > strong')[0]).html();

    let tier = id.substr(0, id.lastIndexOf('-'));
    tier = tier.substr(tier.lastIndexOf('-') + 1);

    currentTier = tier;

    const teamIcons = $(psRoom.find('.battle > div > div.rightbar > div > .teamicons'));
    let teamPokemon = [] as string[];
    teamIcons.each(function () {
      $(this)
        .find('span')
        .each(function () {
          let label = $(this).attr('aria-label');
          if (label !== undefined) {
            label = label.replace('(active)', '');
            label = label.replace('(fainted)', '');

            if (label.indexOf('(') !== -1) {
              let tempLabel = label.substr(label.lastIndexOf('(') + 1);
              tempLabel = tempLabel.substr(0, tempLabel.indexOf(')'));

              if (isNaN(parseInt(tempLabel, 10))) {
                label = tempLabel;
              } else {
                label = label.substr(0, label.indexOf('('));
              }
            }

            teamPokemon.push(label.trim());
          }
        });
    });

    teamPokemon = teamPokemon.filter((entry) => entry !== 'Not revealed');
    const team = teamPokemon.join(';');

    $.ajax({
      url: 'https://fulllifegames.com/Tools/ReplayScouterApi/',
      data: {
        name: oppName,
        tier: tier,
        mode: 'showdown',
        team: team,
      },
    }).done(function (data) {
      $('.battleHelperScouter').html(data);
    });

    $.ajax({
      url: 'https://fulllifegames.com/Tools/SmogonDumpApi/',
      data: {
        list: tier + '.txt',
        team: team,
      },
    }).done(function (data) {
      $('.battleHelperDump').html(data);
    });

    running = true;

    setTimeout(handleDamageCalcs, 100);
  }

  function triggerBattleHelpOff() {
    running = false;
  }

  function addOption() {
    const battleHelperButton = $('<button/>', {
      text: 'Battle Helper',
      click: triggerBattleHelp,
      style: 'margin-left: 5px;',
    });
    const battleHelperButtonOff = $('<button/>', {
      text: 'Battle Helper Off',
      click: triggerBattleHelpOff,
      style: 'margin-left: 5px;',
    });
    $('.ps-popup p:last-child').append(battleHelperButton);
    $('.ps-popup p:last-child').append(battleHelperButtonOff);
  }

  function triggerOptionAddition(this: HTMLElement) {
    currentClickedBattleOptions = this;
    setTimeout(addOption, 1);
  }

  function bootstrap() {
    $("[name='openBattleOptions']").off('click').on('click', triggerOptionAddition);
    setTimeout(bootstrap, 100);
  }

  bootstrap();
})();
