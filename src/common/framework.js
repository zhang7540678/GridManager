
class Framework {
    // 解析存储容器
    compileMap = {};

    // 框架解析唯一值
    getKey(gridManagerName) {
        return `data-compile-id-${gridManagerName || ''}`;
    }

    /**
     * 获取当前表格解析列表
     * @param gridManagerName
     * @returns {*}
     */
    getCompileList(gridManagerName) {
        if (!this.compileMap[gridManagerName]) {
            this.compileMap[gridManagerName] = [];
        }
        return this.compileMap[gridManagerName];
    }

    /**
     * 清空当前表格解析列表
     * @param gridManagerName
     */
    clearCompileList(gridManagerName) {
        this.compileMap[gridManagerName] = [];
    }

    /**
     * 解析: fake thead
     * @param settings
     * @param el
     */
    compileFakeThead(settings, el) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        if (compileAngularjs || compileVue || compileReact) {
            const thList = el.querySelectorAll(`[${this.getKey(gridManagerName)}]`);
            [].forEach.call(thList, item => {
                const obj = compileList[item.getAttribute(`${this.getKey(gridManagerName)}`)];
                item.setAttribute(`${this.getKey(gridManagerName)}`, compileList.length);
                compileList.push({...obj});
            });
        }
    }

    /**
     * 解析: th
     * @param settings
     * @param template
     * @returns {string}
     */
    compileTh(settings, template) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        let compileAttr = '';
        if (compileAngularjs || compileVue || compileReact) {
            compileAttr = `${this.getKey(gridManagerName)}=${compileList.length}`;
            compileList.push({template});
        }

        return compileAttr;
    }

    /**
     * 解析: td
     * @param settings
     * @param el
     * @param row
     * @param index
     * @param key
     * @param template
     * @returns {*}
     */
    compileTd(settings, el, row, index, key, template) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        // React and not template
        if (compileReact && !template) {
            return row[key];
        }

        // React element or function
        if (compileReact) {
            compileList.push({el, template, row, index, fnArg: [row[key], row, index]});
            return '';
        }

        // 解析框架: Vue
        if (compileVue) {
            compileList.push({el, row, index});
        }

        // 解析框架: Angular 1.x
        if (compileAngularjs) {
            compileList.push({el, row, index});
        }

        // not React
        if (!settings.compileReact) {
            return typeof template === 'function' ? template(row[key], row, index) : (typeof template === 'string' ? template : row[key]);
        }
    }

    /**
     * 解析: 空模板
     * @param settings
     * @param el
     * @param template
     * @returns {string}
     */
    compileEmptyTemplate(settings, el, template) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        // React
        if (compileReact) {
            compileList.push({el, template});
            return '';
        }

        // 解析框架: Vue
        if (compileVue) {
            compileList.push({el});
        }

        // 解析框架: Angular 1.x
        if (compileAngularjs) {
            compileList.push({el});
        }
    }

    /**
     * 解析: 通栏
     * @param settings
     * @param el
     * @param row
     * @param index
     * @param template
     * @returns {*}
     */
    compileFullColumn(settings, el, row, index, template) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        // 无模板
        if (!template) {
            return '';
        }

        // React element or function
        if (compileReact) {
            compileList.push({el, template, row, index, fnArg: [row, index]});
            return '';
        }

        // 解析框架: Vue
        if (compileVue) {
            compileList.push({el, row, index});
        }

        // 解析框架: Angular 1.x
        if (compileAngularjs) {
            compileList.push({el, row, index});
        }

        // not react
        return typeof template === 'function' ? template(row, index) : template;
    }

    /**
     * 发送
     * @param settings
     * @param isRunElement: 是否通过属性更新element
     * @returns {Promise<void>}
     */
    async send(settings, isRunElement) {
        const { gridManagerName, compileAngularjs, compileVue, compileReact } = settings;
        const compileList = this.getCompileList(gridManagerName);
        if (compileList.length === 0) {
            return;
        }
        if (isRunElement) {
            compileList.forEach((item, index) => {
                item.el = document.querySelector(`[${this.getKey(gridManagerName)}="${index}"]`);
            });
        }
        // 解析框架: Vue
        if (compileVue) {
            await compileVue(compileList);
        }

        // 解析框架: Angular 1.x
        if (compileAngularjs) {
            await compileAngularjs(compileList);
        }

        // 解析框架: React
        if (compileReact) {
            await compileReact(compileList);
        }

        // 清除解析数据及标识
        compileList.forEach(item => {
            item.el && item.el.removeAttribute(`${this.getKey(gridManagerName)}`);
        });

        // 清除
        this.clearCompileList(gridManagerName);
    }
}

export default new Framework();
