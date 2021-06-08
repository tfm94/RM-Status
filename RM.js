// © 2021 by TFM
// https://github.com/tfm94/RM-Status

await loadSite();

async function loadSite() {
  let radcode = args.widgetParameter;
  log(radcode);
  let url = "http://www.r-m.de";
  let wbv = new WebView();
  await wbv.loadURL(url);

  let jsc =
    `
var arr = new Array()

document.getElementsByClassName("production-status__input")[0].value = "` +
    radcode +
    `"
 

document.getElementsByClassName("production-status__form")[0].submit()


`;
  let jsn = await wbv.evaluateJavaScript(jsc);
  //

  var start = new Date().getTime();

  // await wbv.present()
  await wbv.waitForLoad();
  let htmlget = await wbv.getHTML();

  log(htmlget);

  let prostat = htmlget.substr(htmlget.indexOf('"msg": "') + 8 - 2);

  // log(prostat)
  let widget = new ListWidget();

  if (prostat.substr(2, 4) == "Ihr ") {
    let model = prostat.substr(6, prostat.indexOf(" wird") - 6);
    let beginnDatum = prostat.indexOf(" und ") + 5;
    let LieferungBis = prostat.substr(
      beginnDatum,
      prostat.indexOf("bei Ihrem") - beginnDatum
    );
    let dategetrennt = LieferungBis.split(".");
    let LieferDatum = new Date(
      dategetrennt[2],
      dategetrennt[1] - 1,
      dategetrennt[0]
    );

    let status = htmlget.substr(
      htmlget.indexOf('"status": "') + 11,
      htmlget.substr(htmlget.indexOf('"status": "') + 11).indexOf('",')
    );

    var today = new Date(Date.now());
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);
    today.setSeconds(0);
    if (
      today.getMonth() > LieferDatum.getMonth() ||
      (today.getMonth() === LieferDatum.getMonth() &&
        today.getDay() > LieferDatum.getDay())
    ) {
      let nextYear = LieferDatum.getFullYear();
      nextYear = nextYear + 1;
      LieferDatum.setFullYear(nextYear);
    }
    let convertInDays = 24 * 3600 * 1000;
    let daysleft = parseInt(
      (LieferDatum.getTime() - today.getTime()) / convertInDays
    );
    let n = new Date();
    log("R&M " + model);
    log("Lieferung bis: " + LieferungBis);
    log("Stand: " + n.getHours() + ":" + n.getMinutes());
    log("Noch " + daysleft + " Tage");

    let line1 = widget.addText("R&M " + model);
    let line2 = widget.addText("Lieferung bis: " + LieferungBis);
    let line3 = widget.addText(
      "Stand: " + n.getHours() + ":" + ("0" + n.getMinutes()).slice(-2)
    );
    let line4 = widget.addText("Noch " + daysleft + " Tage");
    let line5 = widget.addText("Status: " + status);

    line1.textColor = Color.green();
    line1.font = Font.boldSystemFont(20);
    line4.font = Font.boldSystemFont(8);
    line4.textColor = decideDisplayColor(daysleft);
    line4.font = Font.boldSystemFont(24);
  } else if (prostat.substr(2, 16) == "Bitte überprüfen") {
    let line1f = widget.addText("Falscher Radcode!");
    line1f.textColor = Color.red();
    line1f.font = Font.boldSystemFont(25);
  } else {
    let line1e = widget.addText("Fehler beim Datenabruf!");
    line1e.textColor = Color.red();
    line1e.font = Font.boldSystemFont(25);
  }
  if (!config.runsInWidget) {
    widget.presentMedium();
  }
  Script.setWidget(widget);

  Script.complete();
}

function decideDisplayColor(daysLeft) {
  if (daysLeft >= 50) {
    return Color.red();
  }

  if (daysLeft >= 14) {
    return Color.yellow();
  }

  return Color.green();
}
