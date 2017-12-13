
$.fn.questionnaire = function (params) {
    var opt = $.fn.questionnaireOpt;
    if (typeof (params) == "object") {
        opt.genWj(params).appendTo(this);
    } else if (params == "save") {
        return opt.saveAnswers(this);
    } else if (params == "schema") {
        return opt.saveSchema(this);
    } else if (params == "restore") {
        var restore = opt.restore(arguments[1], arguments[2]);
        var wj = opt.genWj(restore);
        wj.find('input').prop("disabled", true);
        wj.find('textarea').prop("disabled", true);
        wj.appendTo(this);
    } else if (params == "newquestion") {
        $.extend(true,opt.callback,arguments[1]);
        return new opt.questioner(this);
    }
}

$.fn.questionnaireOpt = {
    classes: undefined,
    callback: {
        onSectionGenerated: function (element, sectionObject) {
            window.console && console.log("onSectionGenerated: ", element);
        },
        onFieldsetGenerated: function (element) {
            window.console && console.log("onFieldsetGenerated: ", element);
        },
        onQuestGenerated: function (element) {
            window.console && console.log("onQuestGenerated: ", element);
        }
    },
    questioner: function(parent){
        var questioner = this;
        var opt = $.fn.questionnaireOpt;
        var optCallbacks = opt.callback;
        this.incNum = 0;
        this.element = $('<ol>').addClass(opt.classes).appendTo($(parent));;
        this.uniqueName = function () {
            var num = this.incNum;
            ++this.incNum;
            return num.toString();
        };
        this.preview = function (questions) {
            var self = this;
            $.each(questions, function (index, section) {
                self.addSection(section);
            });
        };
        this.addSection = function (section, callback) {
            var sectionEl = $('<li>').appendTo(this.element);
            sectionEl.attr("data-title", section.title);
            $('<h3>').text(section.title).appendTo(sectionEl);
            var sectionObject = {
                element: sectionEl,
                addField: function (field, callback) {
                    if(field.name == undefined){
                        field.name = '_' + questioner.uniqueName();
                    }
                    var fieldEl = $('<fieldset>');
                    fieldEl.attr("data-name", field.name);
                    fieldEl.attr("data-type", field.type);
                    fieldEl.attr("data-limit", field.limit);
                    fieldEl.attr("data-legend", field.legend);
                    var legend = $("<legend>").text(field.legend).appendTo(fieldEl);
                    if (field.type == "textarea") {
                        opt.genTextArea(field).appendTo(fieldEl);
                    } else {
                        opt.genCheckList(field).appendTo(fieldEl);
                    }
                    fieldEl.appendTo(sectionEl);
                    var fieldObject = {
                        element: fieldEl
                    };
                    if (typeof (callback) == "function") {
                        callback(fieldEl);
                    } else if (typeof (optCallbacks.onFieldsetGenerated) == "function") {
                        optCallbacks.onFieldsetGenerated(fieldEl,fieldObject);
                    }
                },
            };
            if (typeof (callback) == "function") {
                callback(sectionEl);
            } else if (typeof (optCallbacks.onSectionGenerated) == "function") {
                optCallbacks.onSectionGenerated(sectionEl, sectionObject);
            }
            return sectionObject;
        };
        this.saveSchema = function () {
            return opt.saveSchema(this.element.parent());
        };
    },
    genWj: function (questions) {
        var quest = this;
        var queryList = $('<ol>').addClass("querylist");
        $.each(questions, function (index, item) {
            quest.genSection(item).appendTo(queryList);
        });
        return queryList;
    },
    genSection: function (section, callback) {
        var quest = this;
        var sectionEl = $('<li>');
        sectionEl.attr("data-title", section.title);
        var title = $('<h3>').text(section.title).appendTo(sectionEl);
        $.each(section.fieldsets, function (index, item) {
            quest.genFieldset(item).appendTo(sectionEl);
        })
        return sectionEl;
    },
    genFieldset: function (fieldset, callback) {
        var quest = this;
        var fieldEl = $('<fieldset>');
        fieldEl.attr("data-name", fieldset.name);
        fieldEl.attr("data-type", fieldset.type);
        fieldEl.attr("data-limit", fieldset.limit);
        fieldEl.attr("data-legend", fieldset.legend);
        var legend = $("<legend>").text(fieldset.legend).appendTo(fieldEl);
        if (fieldset.type == "textarea") {
            quest.genTextArea(fieldset).appendTo(fieldEl);
        } else {
            quest.genCheckList(fieldset).appendTo(fieldEl);
        }
        return fieldEl;
    },
    genCheckList: function (fieldset) {
        var ol = $('<ol>');
        $.each(fieldset.list, function (index, item) {
            var textString;
            var checked = false;
            if (typeof (item) == "object") {
                textString = item.text;
                checked = item.checked;
            } else if (typeof (item) == "string") {
                textString = item;
            };
            var quest = this;
            var li = $('<li>').appendTo(ol);
            var input = $('<input>').attr({
                type: fieldset.type,
                name: fieldset.name,
                value: index,
            });
            input.prop("checked", checked);
            if (fieldset.limit > 0 && fieldset.type == "checkbox") {
                input.click(function () {
                    var limit = fieldset.limit;
                    if (ol.find('input:checked').length == limit) {
                        ol.find('input:not(:checked)').prop("disabled", true);
                    } else {
                        ol.find('input').prop("disabled", false);
                    }
                });
            }
            input.appendTo(li);
            li.append(textString);
        })
        return ol;
    },
    genTextArea: function (fieldset) {
        var textArea = $('<textarea>').attr("name", fieldset.name);
        if (typeof (fieldset.value) == "string") {
            textArea.val(fieldset.value);
        }
        return textArea;
    },
    getCheckList: function (listEl, schema) {
        var list = new Array;
        $.each($(listEl).children('li'), function (index, el) {
            var input = $(el).children("input");
            var item;
            if (schema) {
                item = $(el).text();
            } else {
                item = {
                    text: $(el).text(),
                    checked: input.prop("checked"),
                };
            }
            list.push(item);
        });
        return list;
    },
    getFieldset: function (fieldEl, schema) {
        var quest = this;
        var fieldset = new Object;
        fieldEl = $(fieldEl);
        fieldset.name = fieldEl.attr('data-name');
        fieldset.type = fieldEl.attr('data-type');
        fieldset.legend = fieldEl.attr('data-legend');
        if (fieldEl.attr('data-limit') > 0) {
            fieldset.limit = fieldEl.attr('data-limit');
        }
        if (fieldset.type == "textarea") {
            if (schema) {
                fieldset.value = "";
            } else {
                fieldset.value = fieldEl.children('textarea').val();
            }
        } else {
            fieldset.list = quest.getCheckList(fieldEl.children('ol'), schema);
        }
        return fieldset;
    },
    getSection: function (sectionEl, schema) {
        var quest = this;
        var section = new Object;
        sectionEl = $(sectionEl);
        section.title = sectionEl.attr('data-title');
        section.fieldsets = new Array;
        $.each(sectionEl.children('fieldset'), function (index, fieldEl) {
            section.fieldsets.push(quest.getFieldset(fieldEl, schema));
        });
        return section;
    },
    saveAnswers: function (container) {
        var quest = this;
        var sections = $(container).children('ol').children('li');
        var queryList = new Array;
        sections.each(function (index, section) {
            queryList.push(quest.getSection(section));
        });
        return queryList;
    },
    saveSchema: function (container) {
        var quest = this;
        var sections = $(container).children('ol').children('li');
        var queryList = new Array;
        sections.each(function (index, section) {
            queryList.push(quest.getSection(section, true));
        });
        return queryList;
    },
    restore: function (questions, answers) {
        var quest = this;
        $.each(questions, function (si, questionSection) {
            var answerSection = answers[si];
            $.each(questionSection.fieldsets, function (fi, questionFieldset) {
                var answerFieldset = answerSection.fieldsets[fi];
                var type = questionFieldset.type;
                if (type == "textarea") {
                    questions[si].fieldsets[fi].value = answerFieldset.value;
                } else {
                    $.each(questionFieldset.list, function (li, item) {
                        var answerItem = answerFieldset.list[li];
                        if (typeof (questions[si].fieldsets[fi].list[li]) == "string") {
                            questions[si].fieldsets[fi].list[li] = {
                                checked: false,
                                text: questions[si].fieldsets[fi].list[li],
                            }
                        }
                        questions[si].fieldsets[fi].list[li].checked = answerItem.checked;
                    })
                }
            })
        });
        return questions;
    }
}
