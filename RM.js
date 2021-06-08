// © 2021 by TFM and contributors
// https://github.com/tfm94/RM-Status

const status = await loadStatus(args.widgetParameter);

Script.setWidget(buildWidget(status));

Script.complete();

function loadStatus(bikeCode) {
  const request = new Request(
    "https://www.r-m.de/api/forms/send_form_production_status"
  );
  request.method = "POST";
  request.addParameterToMultipart("bike_code", bikeCode);
  request.addParameterToMultipart("language_code", "de");
  request.addParameterToMultipart("beehive", "");
  return request.loadString();
}

function buildWidget(status) {
  const widget = new ListWidget();

  try {
    status = JSON.parse(status);
    log(status);
  } catch (e) {
    log(status);
    addErrorText(widget, "Fehler beim Datenabruf!");
    return widget;
  }

  if (status.result === "error") {
    addErrorText(widget, status.msg);
  } else if (status.result === "success") {
    addSuccessTexts(widget, status);
  }

  return widget;
}

function addErrorText(widget, message) {
  const text = widget.addText(message);
  text.textColor = Color.red();
  text.font = Font.boldSystemFont(25);
}

function addSuccessTexts(widget, status) {
  const modelText = widget.addText(getBikeModel(status.msg));
  modelText.textColor = Color.green();
  modelText.font = Font.boldSystemFont(20);

  const deliveryDates = getDeliveryDates(status.msg);
  if (deliveryDates.length === 2) {
    widget.addText(`Lieferung bis ${deliveryDates[1]}`);

    const latestDelivery = parseDate(deliveryDates[1]);
    const daysLeft = calcDaysUntil(latestDelivery);
    const daysLeftText = widget.addText(`Noch ${daysLeft} Tage`);
    daysLeftText.textColor = decideDisplayColor(daysLeft);
    daysLeftText.font = Font.boldSystemFont(24);

    widget.addText(`Status: ${status.status}`);

    const refreshDate = new Date().toLocaleTimeString().substr(0, 5);
    const refreshText = widget.addText(`Stand: ${refreshDate}`);
    refreshText.font = Font.boldSystemFont(8);
  }
}

function getBikeModel(message) {
  const match = message.match("Ihr (.*) wird voraussichtlich");
  return match && match.length > 1 ? "R&M " + match[1] : "";
}

function getDeliveryDates(message) {
  const match = message.match("zwischen dem (.*) und (.*) bei Ihrem");

  return match && match.length > 2 ? match.slice(1) : [];
}

function parseDate(date) {
  const parts = date.split(".");
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

function calcDaysUntil(date) {
  return Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
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
