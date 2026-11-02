/**
 * LevIT — приём заявок с сайта levit.com.ua
 * Заявка → строка в этой Google Таблице + уведомление в Telegram (+ письмо, если указан EMAIL).
 *
 * Установка — см. integrations/google-sheets/ИНСТРУКЦИЯ.md
 */

// ===================== НАСТРОЙКИ =====================
const CONFIG = {
  TELEGRAM_TOKEN: '',      // ключ бота от @BotFather, например '7123456789:AAH...'
  TELEGRAM_CHAT_ID: '',    // ваш chat id (узнать: запустите функцию findMyChatId). Несколько — через запятую
  EMAIL: '',               // необязательно: копия заявки на почту, например 'ownerlevit@gmail.com'
  SHEET_NAME: 'Заявки',
  STATUSES: ['Новая', 'Связались', 'В работе', 'Клиент', 'Отказ', 'Спам'],
};
// =====================================================

const HEADERS = ['Дата', 'Статус', 'Имя', 'Телефон', 'Компания', 'Должность', 'Формат', 'Задача', 'Тип заявки', 'Страница', 'Комментарий менеджера'];

/** Приём заявки с сайта */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = parseBody_(e);

    // ловушка для ботов: скрытое поле, которое человек не заполняет
    if (d.website) return json_({ ok: true });

    const name = clean_(d.name, 100), phone = clean_(d.phone, 40);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 10) {
      return json_({ ok: false, error: 'validation' });
    }

    const lead = {
      date: new Date(),
      name: name,
      phone: phone,
      company: clean_(d.company, 150),
      role: clean_(d.role, 60),
      format: clean_(d.format, 60),
      message: clean_(d.message, 2000),
      type: clean_(d.type, 150),
      page: clean_(d.page, 200),
    };

    saveToSheet_(lead);
    notify_(lead);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/** Проверка в браузере: откройте ссылку веб-приложения — должно быть "LevIT leads: OK" */
function doGet() {
  return ContentService.createTextOutput('LevIT leads: OK');
}

// ---------- таблица ----------
function saveToSheet_(l) {
  const sh = getSheet_();
  sh.insertRowAfter(1); // новые заявки — сверху
  sh.getRange(2, 1, 1, HEADERS.length).setValues([[
    l.date, CONFIG.STATUSES[0], l.name, "'" + l.phone, l.company, l.role, l.format, l.message, l.type, l.page, '',
  ]]);
  sh.getRange(2, 1, 1, HEADERS.length).setFontWeight('normal').setBackground(null);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_NAME, 0);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#F2C94C').setFontColor('#25292E');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd.MM.yyyy HH:mm');
    sh.getRange('B2:B').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.STATUSES, true).build());
    const widths = [130, 110, 150, 140, 180, 150, 160, 360, 200, 200, 260];
    widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange('H:H').setWrap(true);
    // подсветка новых заявок
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CONFIG.STATUSES[0]).setBackground('#FCF4D9')
      .setRanges([sh.getRange('B2:B')]).build();
    sh.setConditionalFormatRules([rule]);
  }
  return sh;
}

// ---------- уведомления ----------
function notify_(l) {
  const details = [
    '👤 ' + esc_(l.name) + (l.role ? ' (' + esc_(l.role) + ')' : ''),
    '📞 ' + esc_(l.phone),
    l.company ? '🏢 ' + esc_(l.company) : '',
    l.format ? '🗓 ' + esc_(l.format) : '',
    l.message ? '💬 ' + esc_(l.message) : '',
  ].filter(Boolean);
  const lines = ['🔔 <b>Новая заявка с сайта</b>', ''].concat(details, ['',
    '📄 ' + esc_(l.type || 'Заявка') + (l.page ? ' · ' + esc_(l.page) : '')]);

  if (CONFIG.TELEGRAM_TOKEN && CONFIG.TELEGRAM_CHAT_ID) {
    const url = SpreadsheetApp.getActive().getUrl();
    CONFIG.TELEGRAM_CHAT_ID.split(',').map(s => s.trim()).filter(Boolean).forEach(chat => {
      try {
        UrlFetchApp.fetch('https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/sendMessage', {
          method: 'post', contentType: 'application/json', muteHttpExceptions: true,
          payload: JSON.stringify({
            chat_id: chat, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true,
            reply_markup: { inline_keyboard: [[{ text: '📋 Открыть таблицу заявок', url: url }]] },
          }),
        });
      } catch (err) { console.error('Telegram: ' + err); }
    });
  }

  if (CONFIG.EMAIL) {
    try {
      MailApp.sendEmail({
        to: CONFIG.EMAIL,
        subject: 'Заявка с сайта: ' + l.name + ', ' + l.phone,
        htmlBody: lines.join('<br>') + '<br><br><a href="' + SpreadsheetApp.getActive().getUrl() + '">Таблица заявок</a>',
      });
    } catch (err) { console.error('Email: ' + err); }
  }
}

// ---------- служебные функции (запускать вручную из редактора) ----------

/** 1) Напишите своему боту в Telegram любое сообщение, 2) запустите эту функцию — chat id появится в журнале выполнения */
function findMyChatId() {
  if (!CONFIG.TELEGRAM_TOKEN) throw new Error('Сначала вставьте TELEGRAM_TOKEN в CONFIG');
  const r = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/getUpdates').getContentText());
  const chats = {};
  (r.result || []).forEach(u => {
    const m = u.message || u.channel_post || u.my_chat_member;
    if (m && m.chat) chats[m.chat.id] = (m.chat.title || [m.chat.first_name, m.chat.last_name].join(' ')).trim();
  });
  const ids = Object.keys(chats);
  if (!ids.length) { console.log('Чатов не найдено. Напишите боту любое сообщение и запустите функцию ещё раз.'); return; }
  ids.forEach(id => console.log('chat id: ' + id + '   (' + chats[id] + ')'));
}

/** Создаёт тестовую заявку: проверяет таблицу и уведомления */
function testLead() {
  const fake = { postData: { contents: JSON.stringify({
    name: 'Тест Тестович', phone: '+38 (099) 000-00-00', company: 'Тестовая компания',
    role: 'Власник / керівник', format: 'Дзвінок', message: 'Это тестовая заявка — её можно удалить.',
    type: 'Тест', page: '/',
  }) } };
  console.log(doPost(fake).getContent());
}

// ---------- утилиты ----------
function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) { /* не JSON — берём параметры формы */ }
  }
  return (e && e.parameter) || {};
}
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, max); }
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
