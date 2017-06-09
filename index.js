/**
 * Max fixed data count = 1677680 items;
 * @type {{headerHeight: string, filterHeight: string, rowHeight: string, footerHeight: string, filters: boolean, footer: boolean, header: boolean, rowFormatter: null, cellFormatter: null, headerFormatter: null, filterFormatter: null, footerFormatter: null, rowTemplate: (*), headerTemplate: (*), filterTemplate: (*), footerTemplate: (*)}}
 */


const DEFAULT_OPTIONS = {
  // style options
  headerHeight: 25,
  filterHeight: 25,
  rowHeight   : 25,
  footerHeight: 20,

  // include options
  filters: false,
  footer : false,
  header : true,

  // formatters
  rowFormatter   : null,
  cellFormatter  : null,
  headerFormatter: null,
  filterFormatter: null,
  footerFormatter: null,
  editorFormatter: null,

  // templates
  rowTemplate   : $('<div></div>'),
  headerTemplate: $('<div></div>'),
  filterTemplate: $('<div></div>'),
  footerTemplate: $('<div></div>'),
  editorTemplate: $('<div></div>'),

  // render
  renderTimeout: 20,

  // id field
  id: 'id'
};

const DEFAULT_GRID_STYLE = {
  width   : '100%',
  height  : '400px',
  display : 'grid',
  padding : 0,
  margin  : 0,
};

const DEFAULT_HEADER_STYLE = {};
const DEFAULT_FILTER_STYLE = {};
const DEFAULT_LIST_STYLE = {
  display : 'grid',
  height  : '100%',
  width   : '100%',
  position: 'relative',
  overflow: 'scroll'
};

class Grid {
  constructor(container, columns, data , options) {
    Object.assign(this, { data, columns, options: Object.assign({}, DEFAULT_OPTIONS, options) });
    this.elements = {
      container: $(container)
    };

    this.selected = new Set();
    this.filtered = new Set();

    this.renderAwait = null;

    this.mount();
    this.render();
  }

  mount() {
    this.mountContainer();
    this.mountHeader();
    if (this.options.rowFilters) {
      this.mountFilter();
    }
    this.mountList();

    this.startListPosition = this.elements.listBackground.offset().top;
    this.position = Math.abs(this.startListPosition - this.elements.listBackground.offset().top);
    console.log('mount', this.startListPosition, this.position);
  }

  mountContainer() {
    if (this.elements.grid) {
      this.elements.grid.empty().remove();
    }
    this.elements.grid = $('<div></div>')
      .addClass('grid')
      .css(Object.assign({}, DEFAULT_GRID_STYLE, this.options.gridStyle || {}))
      .appendTo(this.elements.container);
    const height = this.elements.grid.height();
    const gridTemplate = this.options.rowFilters
      ? `${this.options.headerHeight}px ${this.options.filterHeight}px ${height - this.options.headerHeight - this.options.filterHeight}px`
      : `${this.options.headerHeight}px ${height - this.options.headerHeight}px`;
    this.elements.grid.css('grid-template-rows', gridTemplate);
  }

  mountHeader() {
    if (this.options.renderHeader instanceof Function) {
      this.elements.header = $(this.options.renderHeader(this.columns)).appendTo(this.elements.grid);
      return;
    }

    if (this.options.templateHeader) {
      this.elements.header = $(this.options.templateHeader).appendTo(this.elements.grid);
    } else {
      this.elements.header = $('<div></div>').appendTo(this.elements.grid);
    }

    if (!this.options.templateHeader) {
      this.elements.header
        .css({}, DEFAULT_HEADER_STYLE, this.options.headerStyle || {})
        .height(this.options.headerHeight)
        .addClass('grid-header')
    }

    this.elements.header
      .appendTo(this.elements.grid);

    for (const column of this.columns) {
      const field = typeof column === 'string' ? column : (column.field || column.id || column.name);
      const name = typeof column === 'string' ? column : column.name;
      let cell = this.elements.header.find(`.${field}`);
      if (!cell.length) {
        cell = $(`<span class="${field}"><span>`);
      }
      cell.text(name).appendTo(this.elements.header);
    }
  }

  mountFilter() {
    this.elements.filter = $('<div></div>')
      .addClass('grid-filter')
      .css(Object.assign({}, DEFAULT_FILTER_STYLE, this.options.filterStyle || {}))
      .appendTo(this.elements.grid);
  }

  mountList() {
    this.elements.list = $('<div></div>')
      .addClass('grid-list')
      .css(Object.assign({}, DEFAULT_LIST_STYLE, this.options.listStyle || {}))
      .appendTo(this.elements.grid);
    this.elements.listBackground = $('<div></div>')
      .addClass('grid-list-background')
      .css({
        width   : '100%',
        position: 'relative',
        height  : `${this.data.length * this.options.rowHeight}px` })
      .appendTo(this.elements.list);
    const elementsBlockHeight = this.elements.list.height();
    this.elementsCount = elementsBlockHeight / this.options.rowHeight;
    this.elements.elements = $('<div></div>')
      .addClass('grid-list-elements')
      .css({
        width               : '100%',
        height              : `${elementsBlockHeight}.px,`,
        position            : 'absolute',
        top                 : 0,
        display             : 'grid',
        'grid-template-rows': `repeat(${this.elementsCount}, ${this.options.rowHeight}px)`
      })
      .appendTo(this.elements.listBackground);

    this.elements.list.on('scroll', () => {
      this.renderAwait && clearTimeout(this.renderAwait);
    this.renderAwait = setTimeout(() => {
      this.position = Math.abs(this.startListPosition - this.elements.listBackground.offset().top);
    this.elements.elements.css('top', this.position);
    this.render();
  }, this.options.renderTimeout);
  });
  }

  render() {
    this.elements.elements.empty();
    const start = Math.floor(this.position / this.options.rowHeight);
    let finish = start + this.elementsCount;
    console.log('render', start, finish, this.data.length);
    if (finish > this.data.length) {
      finish = this.data.length;
    }
    for (let index = start; index < finish; index++) {
      console.log(index);
      this.renderItem(index);
    }
  }

  renderItem(id) {
    const item = this.data[id];
    if (item.render) {
      this.elements.elements.append(item.render(item));
      return;
    }

    if (this.options.templateRow) {
      const template = $(this.options.templateRow).clone();
      for (const column of this.columns) {
        if (typeof column === 'string') {
          template.find(`.${column}`).text(item.data[column]);
          continue;
        }

        const { id, name, field, cellRender } = column;
        const columnName = field || id || name;
        if (cellRender instanceof Function) {
          cellRender(template, item.data, columnName);
        }
      }
      this.elements.elements.append(template);
    }
  }
}