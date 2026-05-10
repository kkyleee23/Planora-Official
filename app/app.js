$(function () {
    'use strict';

    // DB

    var DB = {
        _get: function (key) {
            try { return JSON.parse(localStorage.getItem(key)) || []; }
            catch (e) { return []; }
        },
        _set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },

        // User
        getUser: function () {
            try { return JSON.parse(localStorage.getItem('planora_user')); }
            catch (e) { return null; }
        },
        setUser: function (u) { localStorage.setItem('planora_user', JSON.stringify(u)); },
        clearUser: function () { localStorage.removeItem('planora_user'); },

        // Tasks
        getTasks: function () { return this._get('planora_tasks'); },
        saveTasks: function (t) { this._set('planora_tasks', t); },
        addTask: function (t) {
            t.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            t.createdAt = new Date().toISOString();
            var tasks = this.getTasks();
            tasks.push(t);
            this.saveTasks(tasks);
            return t;
        },
        updateTask: function (id, updates) {
            var tasks = this.getTasks().map(function (t) {
                if (t.id === id) $.extend(t, updates);
                return t;
            });
            this.saveTasks(tasks);
        },
        deleteTask: function (id) {
            this.saveTasks(this.getTasks().filter(function (t) { return t.id !== id; }));
        },

        // Notes
        getNotes: function () { return this._get('planora_notes'); },
        saveNotes: function (n) { this._set('planora_notes', n); },
        addNote: function (n) {
            n.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            n.lastModified = new Date().toISOString();
            var notes = this.getNotes();
            notes.push(n);
            this.saveNotes(notes);
            return n;
        },
        updateNote: function (id, updates) {
            updates.lastModified = new Date().toISOString();
            var notes = this.getNotes().map(function (n) {
                if (n.id === id) $.extend(n, updates);
                return n;
            });
            this.saveNotes(notes);
        },
        deleteNote: function (id) {
            this.saveNotes(this.getNotes().filter(function (n) { return n.id !== id; }));
        },

        // Preferences
        getDark: function () { return localStorage.getItem('planora_dark') === '1'; },
        setDark: function (v) { localStorage.setItem('planora_dark', v ? '1' : '0'); }
    };

    // Quotes

    var quotes = [
        "The secret of getting ahead is getting started.",
        "Don't watch the clock; do what it does. Keep going.",
        "It always seems impossible until it's done.",
        "You don't have to be great to start, but you have to start to be great.",
        "Focus on being productive instead of busy.",
        "A goal without a plan is just a wish.",
        "Small daily improvements are the key to staggering long-term results.",
        "The way to get started is to quit talking and begin doing.",
        "What you do today can improve all your tomorrows.",
        "Start where you are. Use what you have. Do what you can.",
        "Productivity is never an accident. It is always the result of commitment.",
        "Progress, not perfection.",
        "Action is the foundational key to all success.",
        "One task at a time. One step at a time.",
        "Don't count the days, make the days count.",
        "Your future is created by what you do today, not tomorrow.",
        "Well begun is half done.",
        "It does not matter how slowly you go as long as you do not stop.",
        "Simplicity is the ultimate sophistication.",
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "Great things are done by a series of small things brought together.",
        "Discipline is choosing between what you want now and what you want most.",
        "Done is better than perfect.",
        "You are never too old to set another goal or to dream a new dream.",
        "If you spend too long thinking about a thing, you'll never get it done.",
        "Success is the sum of small efforts, repeated day in and day out.",
        "What gets measured gets managed.",
        "The only way to do great work is to love what you do.",
        "Either you run the day, or the day runs you.",
        "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.",
        "Do the hard jobs first. The easy jobs will take care of themselves."
    ];

    function getDailyQuote() {
        var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }

    // Helpers

    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function todayStr() {
        return formatDate(new Date());
    }

    function formatDate(d) {
        var mm = ('0' + (d.getMonth() + 1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        return d.getFullYear() + '-' + mm + '-' + dd;
    }

    function formatDisplay(dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split('-');
        var d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function deadlineText(task) {
        if (task.completed || !task.taskDate) return '';
        var dueDate = new Date(task.taskDate);
        if (task.dueTime) {
            var tp = task.dueTime.split(':');
            dueDate.setHours(parseInt(tp[0]), parseInt(tp[1]));
        } else {
            dueDate.setHours(23, 59, 59);
        }
        var diff = dueDate.getTime() - Date.now();
        if (diff < 0) return 'Overdue';
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return 'Due in ' + days + 'd ' + hours + 'h';
        if (hours > 0) return 'Due in ' + hours + 'h';
        var mins = Math.floor((diff % 3600000) / 60000);
        return 'Due in ' + mins + 'm';
    }

    function priorityLabel(p) {
        if (p === 0) return '<span class="priority-badge p-high">H</span>';
        if (p === 1) return '<span class="priority-badge p-med">M</span>';
        return '<span class="priority-badge p-low">L</span>';
    }

    function startOfWeek(d) {
        var day = d.getDay();
        var diff = (day === 0 ? -6 : 1) - day;
        var mon = new Date(d);
        mon.setDate(d.getDate() + diff);
        mon.setHours(0, 0, 0, 0);
        return mon;
    }

    function toast(msg) {
        var $t = $('#toast');
        $t.text(msg).addClass('show');
        setTimeout(function () { $t.removeClass('show'); }, 2200);
    }

    // Auth

    function checkAuth() {
        var user = DB.getUser();
        if (user) {
            showApp(user);
        } else {
            $('#auth-screen').show();
            $('#app-shell').hide();
        }
    }

    function showApp(user) {
        $('#auth-screen').hide();
        $('#app-shell').show();
        loadDashboard();
        loadSettings(user);
    }

    $('#show-register').on('click', function (e) {
        e.preventDefault();
        $('#auth-form-login').hide();
        $('#auth-form-register').show();
    });

    $('#show-login').on('click', function (e) {
        e.preventDefault();
        $('#auth-form-register').hide();
        $('#auth-form-login').show();
    });

    $('#btn-register').on('click', function () {
        var name = $.trim($('#reg-name').val());
        var email = $.trim($('#reg-email').val());
        var pass = $('#reg-password').val();
        if (!name || !email || !pass) { toast('Please fill all fields'); return; }
        var user = { name: name, email: email, password: pass };
        DB.setUser(user);
        showApp(user);
    });

    $('#btn-login').on('click', function () {
        var email = $.trim($('#login-email').val());
        var pass = $('#login-password').val();
        if (!email || !pass) { toast('Please enter email and password'); return; }
        var user = DB.getUser();
        if (!user) { toast('No account found. Please sign up first.'); return; }
        if (user.email !== email || user.password !== pass) { toast('Invalid credentials'); return; }
        showApp(user);
    });

    // Enter to submit
    $('#login-password').on('keydown', function (e) { if (e.key === 'Enter') $('#btn-login').click(); });
    $('#reg-password').on('keydown', function (e) { if (e.key === 'Enter') $('#btn-register').click(); });

    // Navigation

    function navigateTo(section) {
        $('.section').hide();
        $('#sec-' + section).show();
        $('.nav-item').removeClass('active');
        $('.nav-item[data-section="' + section + '"]').addClass('active');
        $('.mob-nav').removeClass('active');
        $('.mob-nav[data-section="' + section + '"]').addClass('active');

        if (section === 'dashboard') loadDashboard();
        if (section === 'tasks') loadTasks();
        if (section === 'notes') loadNotes();
        if (section === 'calendar') loadCalendar();
        if (section === 'focus') initFocus();
        if (section === 'progress') loadProgress();
        if (section === 'settings') loadSettings();
    }

    $(document).on('click', '.nav-item, .mob-nav', function () {
        navigateTo($(this).data('section'));
    });

    // Dashboard

    function loadDashboard() {
        var user = DB.getUser();
        if (!user) return;

        // Greeting
        var hour = new Date().getHours();
        var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        $('#greeting').text(greet + ', ' + user.name);
        $('#today-date').text(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
        $('#daily-quote').text('"' + getDailyQuote() + '"');

        var tasks = DB.getTasks();
        var done = tasks.filter(function (t) { return t.completed; }).length;
        $('#stat-total').text(tasks.length);
        $('#stat-done').text(done);
        $('#stat-pending').text(tasks.length - done);

        var today = todayStr();
        var todayTasks = tasks.filter(function (t) { return t.taskDate === today; });
        renderTaskList($('#dashboard-tasks'), todayTasks);
        $('#dashboard-empty').toggle(todayTasks.length === 0);

        buildWeeklyChart(tasks);
    }

    function buildWeeklyChart(tasks) {
        var $chart = $('#weekly-chart').empty();
        var mon = startOfWeek(new Date());
        var counts = [];
        var maxCount = 1;

        for (var i = 0; i < 7; i++) {
            var d = new Date(mon);
            d.setDate(mon.getDate() + i);
            var ds = formatDate(d);
            var c = tasks.filter(function (t) { return t.taskDate === ds; }).length;
            counts.push(c);
            if (c > maxCount) maxCount = c;
        }

        for (var j = 0; j < 7; j++) {
            var pct = (counts[j] / maxCount) * 100;
            $chart.append(
                '<div class="chart-bar-wrap">' +
                    '<span class="chart-bar-count">' + counts[j] + '</span>' +
                    '<div class="chart-bar" style="height:' + Math.max(pct, 3) + '%"></div>' +
                    '<span class="chart-bar-label">' + DAYS[j] + '</span>' +
                '</div>'
            );
        }
    }

    // Tasks

    function renderTaskList($container, tasks, draggable) {
        $container.empty();
        tasks.sort(function (a, b) {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (a.priority || 2) - (b.priority || 2);
        });
        tasks.forEach(function (task) {
            var dl = deadlineText(task);
            var dlClass = dl === 'Overdue' ? 'overdue' : '';
            var meta = '';
            if (task.taskDate) meta += '<span>' + formatDisplay(task.taskDate) + '</span>';
            if (task.dueTime) meta += '<span>' + task.dueTime + '</span>';
            if (dl) meta += '<span class="' + dlClass + '">' + dl + '</span>';
            if (task.category) meta += '<span>' + task.category + '</span>';

            var subtaskInfo = '';
            if (task.subtasks && task.subtasks.length) {
                var doneCount = task.subtasks.filter(function (s) { return s.done; }).length;
                subtaskInfo = '<span>' + doneCount + '/' + task.subtasks.length + ' subtasks</span>';
            }

            var dragAttr = draggable ? ' draggable="true"' : '';
            var dragHandle = draggable ? '<span class="drag-handle" title="Drag to reorder">&#8942;&#8942;</span>' : '';

            $container.append(
                '<div class="task-item priority-' + (task.priority != null ? task.priority : 2) + (task.completed ? ' completed' : '') + '" data-id="' + task.id + '"' + dragAttr + '>' +
                    dragHandle +
                    '<div class="task-checkbox' + (task.completed ? ' checked' : '') + '" data-id="' + task.id + '"></div>' +
                    '<div class="task-info">' +
                        '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
                        '<div class="task-meta">' + meta + subtaskInfo + priorityLabel(task.priority != null ? task.priority : 2) + '</div>' +
                    '</div>' +
                    '<div class="task-actions">' +
                        '<button class="task-edit" data-id="' + task.id + '" title="Edit">&#9998;</button>' +
                        '<button class="task-action-btn task-delete" data-id="' + task.id + '" title="Delete">&times;</button>' +
                    '</div>' +
                '</div>'
            );
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Toggle
    $(document).on('click', '.task-checkbox', function () {
        var $cb = $(this);
        var id = $cb.data('id');
        var tasks = DB.getTasks();
        var task = tasks.find(function (t) { return t.id === id; });
        if (!task) return;
        DB.updateTask(id, { completed: !task.completed });
        $cb.addClass('pop');
        setTimeout(function () {
            var active = $('.nav-item.active').data('section') || 'dashboard';
            navigateTo(active);
        }, 200);
    });

    // Delete
    $(document).on('click', '.task-delete', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        DB.deleteTask(id);
        var active = $('.nav-item.active').data('section') || 'dashboard';
        navigateTo(active);
        toast('Task deleted');
    });

    // Edit
    $(document).on('click', '.task-edit', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        var task = DB.getTasks().find(function (t) { return t.id === id; });
        if (!task) return;
        editingTaskId = id;
        $('#task-modal-title').text('Edit Task');
        $('#tm-title').val(task.title || '');
        $('#tm-date').val(task.taskDate || todayStr());
        $('#tm-time').val(task.dueTime || '');
        $('#tm-category').val(task.category || '');
        $('#tm-notes').val(task.notes || '');
        $('#tm-subtasks').empty();
        (task.subtasks || []).forEach(function (s) {
            $('#tm-subtasks').append(
                '<div class="subtask-row">' +
                    '<input type="text" value="' + escapeHtml(s.text) + '">' +
                    '<button class="subtask-remove">&times;</button>' +
                '</div>'
            );
        });
        $('.chip').removeClass('active');
        $('.chip[data-priority="' + (task.priority != null ? task.priority : 2) + '"]').addClass('active');
        $('#task-modal').show();
    });

    // Drag & drop
    var dragId = null;

    $(document).on('dragstart', '.task-item[draggable]', function (e) {
        dragId = $(this).data('id');
        $(this).addClass('dragging');
        e.originalEvent.dataTransfer.effectAllowed = 'move';
    });

    $(document).on('dragend', '.task-item[draggable]', function () {
        $(this).removeClass('dragging');
        $('.task-item').removeClass('drag-over');
    });

    $(document).on('dragover', '.task-item[draggable]', function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
        if ($(this).data('id') === dragId) return;
        $('.task-item').removeClass('drag-over');
        $(this).addClass('drag-over');
    });

    $(document).on('drop', '.task-item[draggable]', function (e) {
        e.preventDefault();
        var targetId = $(this).data('id');
        if (!dragId || dragId === targetId) return;
        var tasks = DB.getTasks();
        var fromIdx = tasks.findIndex(function (t) { return t.id === dragId; });
        var toIdx   = tasks.findIndex(function (t) { return t.id === targetId; });
        if (fromIdx < 0 || toIdx < 0) return;
        var moved = tasks.splice(fromIdx, 1)[0];
        tasks.splice(toIdx, 0, moved);
        DB.saveTasks(tasks);
        loadTasks();
        dragId = null;
    });

    // Filter & search

    var currentFilter = 'today';

    function loadTasks() {
        var tasks = DB.getTasks();
        var q = $.trim($('#task-search').val()).toLowerCase();
        var today = todayStr();
        var mon = startOfWeek(new Date());
        var sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        var sunStr = formatDate(sun);

        var filtered = tasks;

        if (currentFilter === 'today') {
            filtered = tasks.filter(function (t) { return t.taskDate === today; });
        } else if (currentFilter === 'week') {
            filtered = tasks.filter(function (t) { return t.taskDate >= formatDate(mon) && t.taskDate <= sunStr; });
        }

        if (q) {
            filtered = filtered.filter(function (t) {
                return (t.title || '').toLowerCase().indexOf(q) !== -1 ||
                       (t.category || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        renderTaskList($('#tasks-list'), filtered, true);
        $('#tasks-empty').toggle(filtered.length === 0);
    }

    $(document).on('click', '.filter-tab', function () {
        $('.filter-tab').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        loadTasks();
    });

    $('#task-search').on('input', function () {
        loadTasks();
    });

    // ---- Add / Edit Task modal ----

    var editingTaskId = null;

    $('#btn-add-task').on('click', function () {
        editingTaskId = null;
        $('#task-modal-title').text('New Task');
        $('#tm-title').val('');
        $('#tm-date').val(todayStr());
        $('#tm-time').val('');
        $('#tm-category').val('');
        $('#tm-notes').val('');
        $('#tm-subtasks').empty();
        $('.chip').removeClass('active');
        $('.chip-low').addClass('active');
        $('#task-modal').show();
    });

    $(document).on('click', '.chip', function () {
        $('.chip').removeClass('active');
        $(this).addClass('active');
    });

    $('#tm-add-subtask').on('click', function () {
        $('#tm-subtasks').append(
            '<div class="subtask-row">' +
                '<input type="text" placeholder="Subtask...">' +
                '<button class="subtask-remove">&times;</button>' +
            '</div>'
        );
        $('#tm-subtasks .subtask-row:last input').focus();
    });

    $(document).on('click', '.subtask-remove', function () {
        $(this).closest('.subtask-row').remove();
    });

    $('#tm-save').on('click', function () {
        var title = $.trim($('#tm-title').val());
        if (!title) { toast('Please enter a title'); return; }

        var subtasks = [];
        $('#tm-subtasks .subtask-row input').each(function () {
            var v = $.trim($(this).val());
            if (v) subtasks.push({ text: v, done: false });
        });

        var data = {
            title: title,
            taskDate: $('#tm-date').val() || todayStr(),
            dueTime: $('#tm-time').val() || '',
            priority: parseInt($('.chip.active').data('priority')),
            category: $.trim($('#tm-category').val()),
            subtasks: subtasks,
            notes: $.trim($('#tm-notes').val()),
            completed: false
        };

        if (editingTaskId) {
            DB.updateTask(editingTaskId, data);
            toast('Task updated');
        } else {
            DB.addTask(data);
            toast('Task added');
        }

        $('#task-modal').hide();
        var active = $('.nav-item.active').data('section') || 'tasks';
        navigateTo(active);
    });

    $('#tm-cancel, #task-modal-close').on('click', function () {
        $('#task-modal').hide();
    });

    // Overlay close
    $(document).on('click', '.modal-overlay', function (e) {
        if ($(e.target).hasClass('modal-overlay')) $(this).hide();
    });

    // Notes

    function loadNotes() {
        var notes = DB.getNotes();
        var q = $.trim($('#note-search').val()).toLowerCase();

        if (q) {
            notes = notes.filter(function (n) {
                return (n.title || '').toLowerCase().indexOf(q) !== -1 ||
                       (n.contentHtml || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        notes.sort(function (a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.lastModified) - new Date(a.lastModified);
        });

        var $grid = $('#notes-grid').empty();
        notes.forEach(function (note) {
            var colorStyle = note.colorLabel ? 'background:' + note.colorLabel + ';' : '';
            var preview = (note.contentHtml || '').replace(/<[^>]+>/g, '').substring(0, 120);
            var dateStr = new Date(note.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            $grid.append(
                '<div class="note-card' + (note.pinned ? ' pinned' : '') + '" data-id="' + note.id + '" style="' + colorStyle + '">' +
                    '<div class="note-card-title">' + escapeHtml(note.title || 'Untitled') + '</div>' +
                    '<div class="note-card-preview">' + escapeHtml(preview) + '</div>' +
                    '<div class="note-card-date">' + dateStr + '</div>' +
                '</div>'
            );
        });

        $('#notes-empty').toggle(notes.length === 0);
    }

    $('#note-search').on('input', function () { loadNotes(); });

    var editingNoteId = null;

    function openNoteModal(note) {
        editingNoteId = note ? note.id : null;
        $('#note-modal-title').text(note ? 'Edit Note' : 'New Note');
        $('#nm-title').val(note ? note.title : '');
        $('#nm-content').html(note ? note.contentHtml || '' : '');
        $('#nm-pinned').prop('checked', note ? note.pinned : false);
        $('#nm-delete').toggle(!!note);

        $('.color-chip').removeClass('active');
        var c = note ? note.colorLabel || '' : '';
        $('.color-chip').filter(function () { return $(this).data('color') === c; }).addClass('active');
        if (!$('.color-chip.active').length) $('.color-chip').first().addClass('active');

        $('#note-modal').show();
    }

    $('#btn-add-note').on('click', function () { openNoteModal(null); });

    $(document).on('click', '.note-card', function () {
        var id = $(this).data('id');
        var note = DB.getNotes().find(function (n) { return n.id === id; });
        if (note) openNoteModal(note);
    });

    $(document).on('click', '.color-chip', function () {
        $('.color-chip').removeClass('active');
        $(this).addClass('active');
    });

    // Rich text
    $(document).on('click', '.tb-btn', function () {
        document.execCommand($(this).data('cmd'), false, null);
        $('#nm-content').focus();
    });

    $('#nm-save').on('click', function () {
        var title = $.trim($('#nm-title').val()) || 'Untitled';
        var data = {
            title: title,
            contentHtml: $('#nm-content').html(),
            colorLabel: $('.color-chip.active').data('color') || '',
            pinned: $('#nm-pinned').is(':checked')
        };

        if (editingNoteId) {
            DB.updateNote(editingNoteId, data);
            toast('Note saved');
        } else {
            DB.addNote(data);
            toast('Note created');
        }

        $('#note-modal').hide();
        loadNotes();
    });

    $('#nm-delete').on('click', function () {
        if (editingNoteId && confirm('Delete this note?')) {
            DB.deleteNote(editingNoteId);
            $('#note-modal').hide();
            loadNotes();
            toast('Note deleted');
        }
    });

    $('#nm-cancel, #note-modal-close').on('click', function () {
        $('#note-modal').hide();
    });

    // Calendar

    var calYear, calMonth, calSelected;

    function loadCalendar() {
        var now = new Date();
        if (calYear == null) { calYear = now.getFullYear(); calMonth = now.getMonth(); }
        renderCalendar();
    }

    function renderCalendar() {
        $('#cal-month-label').text(MONTHS[calMonth] + ' ' + calYear);

        var tasks = DB.getTasks();
        var taskDates = {};
        tasks.forEach(function (t) { if (t.taskDate) taskDates[t.taskDate] = true; });

        var firstDay = new Date(calYear, calMonth, 1);
        var startDay = firstDay.getDay();
        startDay = (startDay === 0 ? 6 : startDay - 1); // Mon = 0
        var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        var daysInPrev = new Date(calYear, calMonth, 0).getDate();

        var $body = $('#cal-body').empty();
        var todayS = todayStr();

        for (var p = startDay - 1; p >= 0; p--) {
            var pd = daysInPrev - p;
            $body.append('<div class="cal-cell other-month">' + pd + '</div>');
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var ds = calYear + '-' + ('0' + (calMonth + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
            var cls = 'cal-cell';
            if (ds === todayS) cls += ' today';
            if (ds === calSelected) cls += ' selected';
            var dot = taskDates[ds] ? '<div class="cal-dot"></div>' : '';
            $body.append('<div class="' + cls + '" data-date="' + ds + '">' + d + dot + '</div>');
        }

        var totalCells = startDay + daysInMonth;
        var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (var n = 1; n <= remaining; n++) {
            $body.append('<div class="cal-cell other-month">' + n + '</div>');
        }
    }

    $('#cal-prev').on('click', function () {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendar();
    });

    $('#cal-next').on('click', function () {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
    });

    $(document).on('click', '.cal-cell:not(.other-month)', function () {
        calSelected = $(this).data('date');
        $('.cal-cell').removeClass('selected');
        $(this).addClass('selected');

        var tasks = DB.getTasks().filter(function (t) { return t.taskDate === calSelected; });
        var label = new Date(calSelected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        $('#cal-day-label').text(label).show();
        renderTaskList($('#cal-day-tasks'), tasks);
    });

    // Focus

    var focusDuration = 25 * 60; // 25 minutes in seconds
    var focusRemaining = focusDuration;
    var focusInterval = null;
    var focusRunning = false;
    var circumference = 2 * Math.PI * 90;

    function initFocus() {
        if (!focusRunning) {
            updateTimerDisplay();
            updateTimerProgress();
        }
    }

    function updateTimerDisplay() {
        var m = Math.floor(focusRemaining / 60);
        var s = focusRemaining % 60;
        $('#timer-display').text(('0' + m).slice(-2) + ':' + ('0' + s).slice(-2));
    }

    function updateTimerProgress() {
        var fraction = focusRemaining / focusDuration;
        var offset = circumference * (1 - fraction);
        $('#timer-progress').css('stroke-dashoffset', offset);
    }

    $('#focus-start').on('click', function () {
        if (focusRunning) return;
        focusRunning = true;
        $(this).hide();
        $('#focus-pause').show();

        focusInterval = setInterval(function () {
            focusRemaining--;
            if (focusRemaining <= 0) {
                focusRemaining = 0;
                clearInterval(focusInterval);
                focusRunning = false;
                $('#focus-start').show().text('Start');
                $('#focus-pause').hide();
                localStorage.setItem('planora_focus_done', '1');
                toast('Focus session complete!');
            }
            updateTimerDisplay();
            updateTimerProgress();
        }, 1000);
    });

    $('#focus-pause').on('click', function () {
        clearInterval(focusInterval);
        focusRunning = false;
        $(this).hide();
        $('#focus-start').show().text('Resume');
    });

    $('#focus-reset').on('click', function () {
        clearInterval(focusInterval);
        focusRunning = false;
        focusRemaining = focusDuration;
        $('#focus-start').show().text('Start');
        $('#focus-pause').hide();
        updateTimerDisplay();
        updateTimerProgress();
    });

    // Progress

    var ACHIEVEMENTS = [
        { id: 'first',    icon: '🌱', name: 'First Step',     desc: 'Complete your first task',          check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 1; } },
        { id: 'five',     icon: '✋', name: 'High Five',      desc: 'Complete 5 tasks',                  check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 5; } },
        { id: 'ten',      icon: '🔟', name: 'Perfect Ten',    desc: 'Complete 10 tasks',                 check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 10; } },
        { id: 'fifty',    icon: '🏆', name: 'Half Century',   desc: 'Complete 50 tasks',                 check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 50; } },
        { id: 'streak3',  icon: '🔥', name: 'On Fire',        desc: '3-day completion streak',           check: function (t) { return calcStreak(t) >= 3; } },
        { id: 'streak7',  icon: '💫', name: 'Week Warrior',   desc: '7-day completion streak',           check: function (t) { return calcStreak(t) >= 7; } },
        { id: 'planner',  icon: '📅', name: 'Planner',        desc: 'Create tasks for 3 different days', check: function (t) { return (function () { var ds = {}; t.forEach(function (x) { if (x.taskDate) ds[x.taskDate] = 1; }); return Object.keys(ds).length >= 3; })(); } },
        { id: 'priority', icon: '🎯', name: 'Prioritized',    desc: 'Complete a High priority task',     check: function (t) { return t.some(function (x) { return x.completed && x.priority === 0; }); } },
        { id: 'notes',    icon: '📝', name: 'Note Taker',     desc: 'Create 5 notes',                   check: function () { return DB.getNotes().length >= 5; } },
        { id: 'focus',    icon: '⏱️', name: 'Deep Focus',     desc: 'Complete a focus session',         check: function () { return localStorage.getItem('planora_focus_done') === '1'; } }
    ];

    function calcStreak(tasks) {
        var doneByDate = {};
        tasks.forEach(function (t) {
            if (t.completed && t.taskDate) doneByDate[t.taskDate] = true;
        });
        var streak = 0;
        var d = new Date();
        while (true) {
            var ds = formatDate(d);
            if (doneByDate[ds]) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else { break; }
        }
        return streak;
    }

    function loadProgress() {
        var tasks = DB.getTasks();
        var total = tasks.length;
        var done  = tasks.filter(function (t) { return t.completed; }).length;
        var pct   = total > 0 ? Math.round((done / total) * 100) : 0;
        var circumference = 515.22;

        $('#prog-total').text(total);
        $('#prog-done').text(done);
        $('#prog-pending').text(total - done);
        $('#prog-pct').text(pct + '%');
        $('#prog-streak').text(calcStreak(tasks) + ' days');

        var offset = circumference * (1 - pct / 100);
        $('#prog-ring-fill').css('stroke-dashoffset', offset);

        var cats = {};
        tasks.forEach(function (t) {
            var c = t.category || 'Uncategorized';
            if (!cats[c]) cats[c] = { total: 0, done: 0 };
            cats[c].total++;
            if (t.completed) cats[c].done++;
        });
        var $cats = $('#prog-categories').empty();
        if (Object.keys(cats).length === 0) {
            $cats.append('<p style="color:var(--text-muted);font-size:14px;">No tasks yet.</p>');
        } else {
            Object.keys(cats).forEach(function (name) {
                var c = cats[name];
                var barPct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
                $cats.append(
                    '<div class="prog-cat-row">' +
                        '<div class="prog-cat-top">' +
                            '<span class="prog-cat-name">' + escapeHtml(name) + '</span>' +
                            '<span class="prog-cat-count">' + c.done + '/' + c.total + '</span>' +
                        '</div>' +
                        '<div class="prog-cat-bar-bg"><div class="prog-cat-bar-fill" style="width:' + barPct + '%"></div></div>' +
                    '</div>'
                );
            });
        }

        var $ach = $('#prog-achievements').empty();
        ACHIEVEMENTS.forEach(function (a) {
            var unlocked = false;
            try { unlocked = a.check(tasks); } catch (e) {}
            $ach.append(
                '<div class="achievement-card' + (unlocked ? ' unlocked' : '') + '">' +
                    '<div class="achievement-icon">' + a.icon + '</div>' +
                    '<div class="achievement-name">' + a.name + '</div>' +
                    '<div class="achievement-desc">' + a.desc + '</div>' +
                '</div>'
            );
        });
    }

    // Settings

    function loadSettings(user) {
        user = user || DB.getUser();
        if (!user) return;
        $('#profile-name').text(user.name);
        $('#profile-email').text(user.email);
        $('#profile-avatar').text(user.name.charAt(0).toUpperCase());
        $('#dark-toggle').prop('checked', DB.getDark());
    }

    $('#dark-toggle').on('change', function () {
        var dark = $(this).is(':checked');
        DB.setDark(dark);
        $('body').toggleClass('dark', dark);
    });

    // CSV export
    $('#btn-export-csv').on('click', function () {
        var tasks = DB.getTasks();
        if (!tasks.length) { toast('No tasks to export'); return; }
        var header = ['Title', 'Date', 'Time', 'Priority', 'Category', 'Completed', 'Notes'];
        var rows = tasks.map(function (t) {
            var pLabels = ['High', 'Medium', 'Low'];
            return [
                '"' + (t.title || '').replace(/"/g, '""') + '"',
                t.taskDate || '',
                t.dueTime || '',
                pLabels[t.priority != null ? t.priority : 2],
                '"' + (t.category || '').replace(/"/g, '""') + '"',
                t.completed ? 'Yes' : 'No',
                '"' + (t.notes || '').replace(/"/g, '""') + '"'
            ].join(',');
        });
        var csv = [header.join(',')].concat(rows).join('\n');
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'planora-tasks.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Tasks exported!');
    });

    $('#btn-logout').on('click', function () {
        if (confirm('Log out? Your data will remain saved.')) {
            DB.clearUser();
            $('#app-shell').hide();
            $('#auth-screen').show();
            $('#auth-form-register').hide();
            $('#auth-form-login').show();

            $('#login-email, #login-password').val('');
        }
    });

    if (DB.getDark()) {
        $('body').addClass('dark');
    }

    // Keyboard shortcuts
    $(document).on('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        var isEditing = tag === 'input' || tag === 'textarea' || $(e.target).attr('contenteditable');
        var modalOpen = $('#task-modal').is(':visible') || $('#note-modal').is(':visible');

        if (e.key === 'Escape') {
            $('#task-modal, #note-modal').hide();
            return;
        }
        if (isEditing || modalOpen) return;

        var appVisible = $('#app-shell').is(':visible');
        if (!appVisible) return;

        switch (e.key) {
            case 'n': case 'N':
                navigateTo('tasks');
                $('#btn-add-task').trigger('click');
                break;
            case '/':
                e.preventDefault();
                navigateTo('tasks');
                setTimeout(function () { $('#task-search').focus(); }, 50);
                break;
            case 'p': case 'P':
                navigateTo('progress');
                break;
            case 'd': case 'D':
                navigateTo('dashboard');
                break;
        }
    });

    checkAuth();
});
