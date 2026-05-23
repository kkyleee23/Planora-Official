$(function () {
    'use strict';

    // ============ DB ============

    var DB = {
        _get: function (key) {
            try { return JSON.parse(localStorage.getItem(key)) || []; }
            catch (e) { return []; }
        },
        _set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },

        getUser: function () {
            try { return JSON.parse(localStorage.getItem('planora_user')); }
            catch (e) { return null; }
        },
        setUser: function (u) { localStorage.setItem('planora_user', JSON.stringify(u)); },
        clearUser: function () { localStorage.removeItem('planora_user'); },

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

        getDark: function () { return localStorage.getItem('planora_dark') === '1'; },
        setDark: function (v) { localStorage.setItem('planora_dark', v ? '1' : '0'); },

        // Focus sessions
        getFocusSessions: function () { return this._get('planora_focus_sessions'); },
        saveFocusSession: function (session) {
            session.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            session.completedAt = new Date().toISOString();
            var sessions = this.getFocusSessions();
            sessions.push(session);
            this._set('planora_focus_sessions', sessions);
            return session;
        },

        // Sort preference
        getSortPref: function () { return localStorage.getItem('planora_sort') || 'default'; },
        setSortPref: function (v) { localStorage.setItem('planora_sort', v); }
    };

    // ===== Recurring Task Engine =====
    function processRecurringTasks() {
        var tasks = DB.getTasks();
        var now = new Date();
        var todayStr = now.toISOString().slice(0, 10);
        var changed = false;

        tasks.forEach(function (task) {
            if (!task.recurrence || !task.completed || !task.taskDate) return;
            var trueOrigin = task.recurrence_origin || task.id;

            var isLatest = !tasks.some(function (t) {
                return t.recurrence_origin === trueOrigin && t.completed && t.id !== task.id &&
                       t.taskDate > task.taskDate;
            });
            if (!isLatest && task.recurrence_origin) return;

            var alreadyExists = tasks.some(function (t) {
                return (t.recurrence_origin === trueOrigin || t.recurrence_origin === task.id) && !t.completed;
            });
            if (alreadyExists) return;

            var next = getNextRecurrenceDate(task.taskDate, task.recurrence);
            if (!next) return;

            while (next < todayStr) {
                next = getNextRecurrenceDate(next, task.recurrence);
                if (!next) return;
            }

            var newTask = {
                title: task.title,
                taskDate: next,
                dueTime: task.dueTime || '',
                priority: task.priority != null ? task.priority : 2,
                category: task.category || '',
                subtasks: (task.subtasks || []).map(function (s) { return { text: s.text, done: false }; }),
                notes: task.notes || '',
                completed: false,
                recurrence: task.recurrence,
                recurrence_origin: trueOrigin
            };
            DB.addTask(newTask);
            changed = true;
        });

        return changed;
    }

    function getNextRecurrenceDate(dateStr, recurrence) {
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        switch (recurrence) {
            case 'daily': d.setDate(d.getDate() + 1); break;
            case 'weekly': d.setDate(d.getDate() + 7); break;
            case 'monthly': d.setMonth(d.getMonth() + 1); break;
            case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
            default: return null;
        }
        var m = d.getMonth() + 1;
        var day = d.getDate();
        return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    }

    // ============ SVG Icons ============

    var IC = {
        seedling: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M12 20v-8"/><path d="M12 12c-3.5 0-6-2.5-6-6 1.5 0 4 .5 6 3 2-2.5 4.5-3 6-3 0 3.5-2.5 6-6 6z"/></svg>',
        hand: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a1 1 0 00-2 0V4a1 1 0 00-2 0V3a1 1 0 00-2 0v1a1 1 0 00-2 0v7l-1.8-1.8a1.3 1.3 0 00-1.8 0 1.3 1.3 0 000 1.8L11 16c1 2 2 4 5 4 3.3 0 6-2.7 6-6V9a1 1 0 00-2 0v2"/></svg>',
        medal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>',
        trophy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>',
        fire: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5.39-2.59-10.2-6.5-13.33zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>',
        star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
        calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        target: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/><circle cx="12" cy="12" r="2"/></svg>',
        notepad: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        focus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93v2.02c5.05-.5 9-4.76 9-9.95s-3.95-9.45-9-9.95z"/><path d="M11 2.05C5.95 2.55 2 6.81 2 12s3.95 9.45 9 9.95v-2.02c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93V2.05z"/></svg>',
        repeat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>'
    };

    // ============ Quotes ============

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

    // ============ Helpers ============

    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function todayStr() { return formatDate(new Date()); }

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

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ============ Auth ============

    function checkAuth() {
        var user = DB.getUser();
        if (user) { showApp(user); }
        else { $('#auth-screen').show(); $('#app-shell').hide(); }
    }

    function showApp(user) {
        $('#auth-screen').hide();
        $('#app-shell').show();
        processRecurringTasks();
        checkWhatsNew();
        loadDashboard();
        loadSettings(user);
    }

    $('#show-register').on('click', function (e) { e.preventDefault(); $('#auth-form-login').hide(); $('#auth-form-register').show(); });
    $('#show-login').on('click', function (e) { e.preventDefault(); $('#auth-form-register').hide(); $('#auth-form-login').show(); });

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

    $('#login-password').on('keydown', function (e) { if (e.key === 'Enter') $('#btn-login').click(); });
    $('#reg-password').on('keydown', function (e) { if (e.key === 'Enter') $('#btn-register').click(); });

    // ============ Navigation ============

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

    // ============ Dashboard ============

    function loadDashboard() {
        var user = DB.getUser();
        if (!user) return;

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

    // ============ Tasks ============

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
            if (task.recurrence) meta += '<span class="task-recurrence-badge">' + IC.repeat + ' ' + task.recurrence + '</span>';

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

    // ===== Task Detail Sheet =====
    var detailTaskId = null;

    function openDetailSheet(id) {
        var task = DB.getTasks().find(function (t) { return t.id === id; });
        if (!task) return;
        detailTaskId = id;

        var $title = $('#detail-title');
        $title.text(task.title).attr('contenteditable', 'true');

        var $cb = $('#detail-checkbox');
        $cb.toggleClass('checked', !!task.completed);

        var dateVal = task.taskDate || '';
        $('#detail-date').text(dateVal ? formatDisplay(dateVal) : 'No date').toggleClass('empty', !dateVal);
        $('#detail-date-input').val(dateVal);

        var timeVal = task.dueTime || '';
        $('#detail-time').text(timeVal || 'No time').toggleClass('empty', !timeVal);
        $('#detail-time-input').val(timeVal);

        var pLabels = ['High', 'Medium', 'Low'];
        var pColors = ['var(--high)', 'var(--medium)', 'var(--low)'];
        var p = task.priority != null ? task.priority : 2;
        $('#detail-priority').text(pLabels[p]).css('color', pColors[p]);

        var cat = task.category || '';
        $('#detail-category').text(cat || 'None').toggleClass('empty', !cat);
        $('#detail-category-input').val(cat);

        var rec = task.recurrence || '';
        $('#detail-recurrence').text(rec ? ('Repeats ' + rec) : 'None').toggleClass('empty', !rec);
        $('#detail-recurrence-row').show();

        var $sl = $('#detail-subtasks-list').empty();
        if (task.subtasks && task.subtasks.length) {
            task.subtasks.forEach(function (s) {
                $sl.append('<div class="detail-subtask-item' + (s.done ? ' done' : '') + '">' +
                    (s.done ? '&#10003; ' : '&#9675; ') + escapeHtml(s.text) + '</div>');
            });
            $('#detail-subtasks-row').show();
        } else {
            $('#detail-subtasks-row').hide();
        }

        var notes = task.notes || '';
        if (notes) {
            $('#detail-notes-preview').text(notes);
            $('#detail-notes-row').show();
        } else {
            $('#detail-notes-row').hide();
        }

        $('#task-detail-sheet').show();
    }

    $('#detail-close').on('click', function () { $('#task-detail-sheet').hide(); detailTaskId = null; });

    $(document).on('click', '#task-detail-sheet', function (e) {
        if ($(e.target).attr('id') === 'task-detail-sheet') { $(this).hide(); detailTaskId = null; }
    });

    $('#detail-checkbox').on('click', function () {
        if (!detailTaskId) return;
        var task = DB.getTasks().find(function (t) { return t.id === detailTaskId; });
        if (!task) return;
        DB.updateTask(detailTaskId, { completed: !task.completed });
        $(this).toggleClass('checked');
        var active = $('.nav-item.active').data('section') || 'tasks';
        navigateTo(active);
    });

    $('#detail-title').on('blur', function () {
        if (!detailTaskId) return;
        var newTitle = $.trim($(this).text());
        if (newTitle) DB.updateTask(detailTaskId, { title: newTitle });
    });
    $('#detail-title').on('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); $(this).blur(); }
    });

    $('#detail-date-row').on('click', function (e) {
        if ($(e.target).is('input')) return;
        var $input = $('#detail-date-input');
        var $val = $('#detail-date');
        $val.hide(); $input.show().focus();
    });
    $('#detail-date-input').on('change blur', function (e) {
        e.stopPropagation();
        var val = $(this).val();
        DB.updateTask(detailTaskId, { taskDate: val });
        $('#detail-date').text(val ? formatDisplay(val) : 'No date').toggleClass('empty', !val).show();
        $(this).hide();
        navigateTo($('.nav-item.active').data('section') || 'tasks');
    });

    $('#detail-time-row').on('click', function (e) {
        if ($(e.target).is('input')) return;
        var $input = $('#detail-time-input');
        var $val = $('#detail-time');
        $val.hide(); $input.show().focus();
    });
    $('#detail-time-input').on('change blur', function (e) {
        e.stopPropagation();
        var val = $(this).val();
        DB.updateTask(detailTaskId, { dueTime: val });
        $('#detail-time').text(val || 'No time').toggleClass('empty', !val).show();
        $(this).hide();
    });

    $('#detail-priority-row').on('click', function () {
        if (!detailTaskId) return;
        var task = DB.getTasks().find(function (t) { return t.id === detailTaskId; });
        if (!task) return;
        var p = task.priority != null ? task.priority : 2;
        var next = (p + 1) % 3;
        DB.updateTask(detailTaskId, { priority: next });
        var pLabels = ['High', 'Medium', 'Low'];
        var pColors = ['var(--high)', 'var(--medium)', 'var(--low)'];
        $('#detail-priority').text(pLabels[next]).css('color', pColors[next]);
        navigateTo($('.nav-item.active').data('section') || 'tasks');
    });

    $('#detail-category-row').on('click', function (e) {
        if ($(e.target).is('input')) return;
        var $input = $('#detail-category-input');
        var $val = $('#detail-category');
        $val.hide(); $input.show().focus();
    });
    $('#detail-category-input').on('change blur', function (e) {
        e.stopPropagation();
        var val = $.trim($(this).val());
        DB.updateTask(detailTaskId, { category: val });
        $('#detail-category').text(val || 'None').toggleClass('empty', !val).show();
        $(this).hide();
    });

    $('#detail-recurrence-row').on('click', function () {
        if (!detailTaskId) return;
        var task = DB.getTasks().find(function (t) { return t.id === detailTaskId; });
        if (!task) return;
        var options = [null, 'daily', 'weekly', 'monthly', 'yearly'];
        var current = options.indexOf(task.recurrence || null);
        var next = (current + 1) % options.length;
        DB.updateTask(detailTaskId, { recurrence: options[next] });
        var label = options[next] ? ('Repeats ' + options[next]) : 'None';
        $('#detail-recurrence').text(label).toggleClass('empty', !options[next]);
    });

    $('#detail-delete').on('click', function () {
        if (!detailTaskId) return;
        DB.deleteTask(detailTaskId);
        $('#task-detail-sheet').hide();
        detailTaskId = null;
        navigateTo($('.nav-item.active').data('section') || 'tasks');
        toast('Task deleted');
    });

    $('#detail-edit').on('click', function () {
        if (!detailTaskId) return;
        var id = detailTaskId;
        $('#task-detail-sheet').hide();
        detailTaskId = null;
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
                '<div class="subtask-row"><input type="text" value="' + escapeHtml(s.text) + '"><button class="subtask-remove">&times;</button></div>'
            );
        });
        $('.chip').removeClass('active');
        $('.chip[data-priority="' + (task.priority != null ? task.priority : 2) + '"]').addClass('active');
        $('#tm-repeat').val(task.recurrence || '');
        $('#task-modal').show();
    });

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

    // Open detail sheet on task body click
    $(document).on('click', '.task-info', function (e) {
        var id = $(this).closest('.task-item').data('id');
        if (id) openDetailSheet(id);
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
        $('#tm-repeat').val(task.recurrence || '');
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

    // ============ Filter, Search & Sort ============

    var currentFilter = 'today';
    var currentSort = DB.getSortPref();

    function initSortUI() {
        $('.sort-option').removeClass('active');
        $('.sort-option[data-sort="' + currentSort + '"]').addClass('active');
    }

    function applySortOrder(tasks) {
        switch (currentSort) {
            case 'priority':
                tasks.sort(function (a, b) {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (a.priority || 2) - (b.priority || 2);
                });
                break;
            case 'date':
                tasks.sort(function (a, b) {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (a.taskDate || '').localeCompare(b.taskDate || '');
                });
                break;
            case 'name':
                tasks.sort(function (a, b) {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (a.title || '').localeCompare(b.title || '');
                });
                break;
            default:
                tasks.sort(function (a, b) {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (a.priority || 2) - (b.priority || 2);
                });
        }
        return tasks;
    }

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

        filtered = applySortOrder(filtered);
        renderTaskList($('#tasks-list'), filtered, true);
        $('#tasks-empty').toggle(filtered.length === 0);
        initSortUI();
    }

    $(document).on('click', '.filter-tab', function () {
        $('.filter-tab').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        loadTasks();
    });

    $('#task-search').on('input', function () { loadTasks(); });

    // Sort dropdown
    $('#btn-sort-tasks').on('click', function (e) {
        e.stopPropagation();
        $('#sort-dropdown').toggle();
    });

    $(document).on('click', '.sort-option', function () {
        currentSort = $(this).data('sort');
        DB.setSortPref(currentSort);
        $('.sort-option').removeClass('active');
        $(this).addClass('active');
        $('#sort-dropdown').hide();
        loadTasks();
    });

    $(document).on('click', function () { $('#sort-dropdown').hide(); });

    // ============ Add / Edit Task Modal ============

    var editingTaskId = null;

    $('#btn-add-task').on('click', function () {
        editingTaskId = null;
        $('#task-modal-title').text('New Task');
        $('#tm-title').val('');
        $('#tm-date').val(todayStr());
        $('#tm-time').val('');
        $('#tm-category').val('');
        $('#tm-repeat').val('');
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
            completed: false,
            recurrence: $('#tm-repeat').val() || null
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

    $('#tm-cancel, #task-modal-close').on('click', function () { $('#task-modal').hide(); });

    $(document).on('click', '.modal-overlay', function (e) {
        if ($(e.target).hasClass('modal-overlay')) $(this).hide();
    });

    // ============ Notes ============

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

    $('#nm-cancel, #note-modal-close').on('click', function () { $('#note-modal').hide(); });

    // ============ Calendar ============

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
        startDay = (startDay === 0 ? 6 : startDay - 1);
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
        $('#cal-day-label').text(label);
        $('#cal-day-header').show();
        renderTaskList($('#cal-day-tasks'), tasks);
    });

    // Calendar add task
    $('#btn-cal-add-task').on('click', function () {
        if (!calSelected) return;
        editingTaskId = null;
        $('#task-modal-title').text('New Task');
        $('#tm-title').val('');
        $('#tm-date').val(calSelected);
        $('#tm-time').val('');
        $('#tm-category').val('');
        $('#tm-notes').val('');
        $('#tm-subtasks').empty();
        $('.chip').removeClass('active');
        $('.chip-low').addClass('active');
        $('#task-modal').show();
    });

    // ============ Focus Timer (Pomodoro) ============

    var WORK_DURATION = 25 * 60;
    var SHORT_BREAK = 5 * 60;
    var LONG_BREAK = 15 * 60;
    var SESSIONS_BEFORE_LONG = 4;

    var focusPhase = 'work';
    var focusDuration = WORK_DURATION;
    var focusRemaining = WORK_DURATION;
    var focusInterval = null;
    var focusRunning = false;
    var focusSessionCount = 0;
    var circumference = 2 * Math.PI * 90;

    function initFocus() {
        if (!focusRunning) { updateFocusUI(); }
        updateFocusTodayStats();
    }

    function updateFocusUI() {
        updateTimerDisplay();
        updateTimerProgress();
        updatePhaseLabel();
        updateSessionInfo();
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

    function updatePhaseLabel() {
        var label = 'Work';
        if (focusPhase === 'short-break') label = 'Short Break';
        if (focusPhase === 'long-break') label = 'Long Break';
        $('#focus-phase-label').text(label);

        var isBreak = focusPhase !== 'work';
        $('#focus-timer-ring').toggleClass('break-mode', isBreak);
        $('#focus-phase-label').toggleClass('break-mode', isBreak);
    }

    function updateSessionInfo() {
        var num = Math.min(focusSessionCount + 1, SESSIONS_BEFORE_LONG);
        $('#focus-session-info').text('Session ' + num + ' of ' + SESSIONS_BEFORE_LONG);
    }

    function startNextPhase() {
        if (focusPhase === 'work') {
            focusSessionCount++;
            DB.saveFocusSession({
                taskName: $.trim($('#focus-task-name').val()) || 'Untitled',
                duration: WORK_DURATION / 60,
                type: 'work'
            });
            updateFocusTodayStats();

            if (focusSessionCount % SESSIONS_BEFORE_LONG === 0) {
                focusPhase = 'long-break';
                focusDuration = LONG_BREAK;
            } else {
                focusPhase = 'short-break';
                focusDuration = SHORT_BREAK;
            }
        } else {
            focusPhase = 'work';
            focusDuration = WORK_DURATION;
        }
        focusRemaining = focusDuration;
        focusRunning = false;
        $('#focus-start').show().text('Start');
        $('#focus-pause').hide();
        updateFocusUI();
        toast(focusPhase === 'work' ? 'Break over — ready to focus.' : 'Session complete — take a break.');
    }

    function updateFocusTodayStats() {
        var sessions = DB.getFocusSessions();
        var today = todayStr();
        var todaySessions = sessions.filter(function (s) {
            return s.type === 'work' && s.completedAt && s.completedAt.substring(0, 10) === today;
        });
        var totalMinutes = 0;
        todaySessions.forEach(function (s) { totalMinutes += (s.duration || 0); });
        $('#focus-stat-sessions').text(todaySessions.length);
        $('#focus-stat-minutes').text(totalMinutes);
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
                updateFocusUI();
                startNextPhase();
                return;
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
        focusPhase = 'work';
        focusDuration = WORK_DURATION;
        focusRemaining = WORK_DURATION;
        focusSessionCount = 0;
        $('#focus-start').show().text('Start');
        $('#focus-pause').hide();
        updateFocusUI();
    });

    // Focus History
    $('#btn-focus-history').on('click', function () {
        var sessions = DB.getFocusSessions();
        var recent = sessions.filter(function (s) { return s.type === 'work'; }).reverse().slice(0, 20);
        var $list = $('#focus-history-list').empty();

        if (recent.length === 0) {
            $('#focus-history-empty').show();
        } else {
            $('#focus-history-empty').hide();
            recent.forEach(function (s) {
                var date = new Date(s.completedAt);
                var dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                var timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                $list.append(
                    '<div class="focus-history-item">' +
                        '<div class="focus-history-info">' +
                            '<span class="focus-history-task">' + escapeHtml(s.taskName || 'Untitled') + '</span>' +
                            '<span class="focus-history-meta">' + dateStr + ' at ' + timeStr + '</span>' +
                        '</div>' +
                        '<span class="focus-history-duration">' + (s.duration || 25) + 'min</span>' +
                    '</div>'
                );
            });
        }
        $('#focus-history-modal').show();
    });

    $('#focus-history-close').on('click', function () { $('#focus-history-modal').hide(); });

    // ============ Progress & Achievements ============

    var ACHIEVEMENTS = [
        { id: 'first',    svg: IC.seedling, name: 'First Step',     desc: 'Complete your first task',          check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 1; } },
        { id: 'five',     svg: IC.hand,     name: 'High Five',      desc: 'Complete 5 tasks',                  check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 5; } },
        { id: 'ten',      svg: IC.medal,    name: 'Perfect Ten',    desc: 'Complete 10 tasks',                 check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 10; } },
        { id: 'fifty',    svg: IC.trophy,   name: 'Half Century',   desc: 'Complete 50 tasks',                 check: function (t) { return t.filter(function (x) { return x.completed; }).length >= 50; } },
        { id: 'streak3',  svg: IC.fire,     name: 'On Fire',        desc: '3-day completion streak',           check: function (t) { return calcStreak(t) >= 3; } },
        { id: 'streak7',  svg: IC.star,     name: 'Week Warrior',   desc: '7-day completion streak',           check: function (t) { return calcStreak(t) >= 7; } },
        { id: 'planner',  svg: IC.calendar, name: 'Planner',        desc: 'Create tasks for 3 different days', check: function (t) { var ds = {}; t.forEach(function (x) { if (x.taskDate) ds[x.taskDate] = 1; }); return Object.keys(ds).length >= 3; } },
        { id: 'priority', svg: IC.target,   name: 'Prioritized',    desc: 'Complete a High priority task',     check: function (t) { return t.some(function (x) { return x.completed && x.priority === 0; }); } },
        { id: 'notes',    svg: IC.notepad,  name: 'Note Taker',     desc: 'Create 5 notes',                   check: function () { return DB.getNotes().length >= 5; } },
        { id: 'focus',    svg: IC.focus,    name: 'Deep Focus',     desc: 'Complete a focus session',          check: function () { return DB.getFocusSessions().filter(function (s) { return s.type === 'work'; }).length >= 1; } }
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
        var ringCirc = 515.22;

        $('#prog-total').text(total);
        $('#prog-done').text(done);
        $('#prog-pending').text(total - done);
        $('#prog-pct').text(pct + '%');
        $('#prog-streak').text(calcStreak(tasks) + ' days');

        var offset = ringCirc * (1 - pct / 100);
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
                    '<div class="achievement-icon">' + a.svg + '</div>' +
                    '<div class="achievement-name">' + a.name + '</div>' +
                    '<div class="achievement-desc">' + a.desc + '</div>' +
                '</div>'
            );
        });
    }

    // ============ Settings ============

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

    if (DB.getDark()) { $('body').addClass('dark'); }

    // ============ Keyboard Shortcuts ============

    $(document).on('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        var isEditing = tag === 'input' || tag === 'textarea' || $(e.target).attr('contenteditable');
        var modalOpen = $('#task-modal').is(':visible') || $('#note-modal').is(':visible') || $('#focus-history-modal').is(':visible');

        if (e.key === 'Escape') {
            $('#task-modal, #note-modal, #focus-history-modal').hide();
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

    // ============ Banner Dismiss ============

    $('#banner-dismiss').on('click', function () {
        $('#app-banner').addClass('hidden');
        setTimeout(function () { $('#app-banner').hide(); }, 300);
    });

    // ===== What's New =====
    function checkWhatsNew() {
        if (localStorage.getItem('planora_seen_changelog_3_0_0')) return;

        var features = [
            { icon: IC.calendar, title: 'Smart Notifications', desc: 'Deadline reminders, overload warnings, and celebration alerts' },
            { icon: IC.notepad, title: 'Weekly Planning', desc: 'Plan your week with Nora and get Sunday evening summaries' },
            { icon: IC.focus, title: 'Pomodoro Break Cycles', desc: '5-min short breaks, 15-min long break after 4 sessions' },
            { icon: IC.fire, title: 'Focus Session History', desc: 'Track your focus sessions with today stats and history' },
            { icon: IC.target, title: 'Task Sorting', desc: 'Sort by priority, date, name, or default order' },
            { icon: IC.star, title: 'Productivity Insights', desc: 'Peak hours, daily averages, and coaching cards' },
            { icon: IC.hand, title: 'Calendar Task Creation', desc: 'Add tasks directly from any calendar day' }
        ];

        var $list = $('#whats-new-list').empty();
        features.forEach(function (f) {
            $list.append(
                '<div class="whats-new-item">' +
                    '<div class="whats-new-icon">' + f.icon + '</div>' +
                    '<div class="whats-new-text"><h3>' + f.title + '</h3><p>' + f.desc + '</p></div>' +
                '</div>'
            );
        });

        $('#whats-new-modal').show();
    }

    $('#whats-new-dismiss, #whats-new-close').on('click', function () {
        localStorage.setItem('planora_seen_changelog_3_0_0', '1');
        $('#whats-new-modal').hide();
    });
    $(document).on('click', '#whats-new-modal', function (e) {
        if ($(e.target).attr('id') === 'whats-new-modal') {
            localStorage.setItem('planora_seen_changelog_3_0_0', '1');
            $(this).hide();
        }
    });

    // ============ Init ============

    checkAuth();
});