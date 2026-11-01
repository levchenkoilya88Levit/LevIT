# LevIT — сайт levit.com.ua

Многостраничный сайт на **Jekyll**. GitHub Pages собирает его автоматически после каждого коммита — ничего устанавливать не нужно. Все правки можно делать прямо в веб-интерфейсе GitHub (кнопка ✏️ на файле).

## Карта сайта

| Страница | Адрес | Где редактировать |
|---|---|---|
| Главная | `/` | `index.html` |
| Наши услуги (обзор) | `/poslugy/` | `poslugy/index.html` |
| └ Готовые решения (каталог) | `/poslugy/gotovi-rishennya/` | категории — `_data/solution_categories.yml` |
| &nbsp;&nbsp;&nbsp;└ Страница решения | `/poslugy/gotovi-rishennya/<файл>/` | `_solutions/<файл>.md` |
| └ Сопровождение BAS (1С) | `/poslugy/suprovid-bas/` | направления — `_data/support_services.yml`, остальное — `poslugy/suprovid-bas/index.html` |
| Серверы | `/servery/` | `_data/servers.yml` (партнёр, услуги, тарифы) |
| Кейсы | `/keisy/` | `_cases/*.md` |
| Отзывы | `/vidguky/` | `_data/reviews.yml` |
| О компании | `/pro-kompaniyu/` | `pro-kompaniyu/index.html`, команда — `_data/team.yml` |
| Контакты | `/kontakty/` | `_data/company.yml` |

Меню, мега-меню «Наші послуги», футер и `sitemap.xml` собираются **автоматически** из этих файлов.

## Частые задачи

**Поменять телефон, email, адрес, цифры (5+, 150+…)** → `_data/company.yml`. Обновится на всех страницах.

**Добавить готовое решение** → скопируйте любой файл из `_solutions/`, назовите латиницей (`ukrposhta.md`), поправьте поля сверху и текст. Оно само появится в каталоге, в мега-меню (через категорию) и в футере.

**Добавить категорию решений** → допишите блок в `_data/solution_categories.yml`, затем укажите её `id` в поле `category` у решений.

**Добавить кейс** → скопируйте `_cases/ZRAZOK-keisu.md` (образец, на сайте скрыт), заполните и удалите строку `published: false`. Кейсы появятся на странице «Кейси» и на главной.

**Добавить отзыв** → `_data/reviews.yml`, образец внутри файла. Блок отзывов появится и на главной.

**Заявки на почту** → зарегистрируйтесь на formspree.io и вставьте адрес формы в `form_endpoint` в `_data/company.yml`. Пока пусто — форма открывает почтовую программу с готовым письмом.

## Структура

```
_config.yml            настройки Jekyll
_data/                 данные: контакты, категории, услуги, отзывы, серверы, команда
_solutions/            страницы готовых решений (Markdown)
_cases/                кейсы (Markdown)
_layouts/              шаблоны: default, solution, case
_includes/             шапка, футер, форма, карточки, иконки
assets/css/main.css    стили
assets/js/main.js      меню, фильтр каталога, формы
```

## Локальный просмотр (необязательно)

```bash
gem install jekyll -v 3.10.0
jekyll _3.10.0_ serve --unpublished
```
