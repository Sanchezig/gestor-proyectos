
        // ========== CONFIGURACIÓN PRODUCCIÓN ==========
        
        // =====================================================
        // =========== CONFIGURACIÓN Y VARIABLES GLOBALES ======
        // =====================================================


        // const SUPABASE_URL = "https://snyvvbwkkqpecfcvvdid.supabase.co";
        // const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNueXZ2Yndra3FwZWNmY3Z2ZGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc3MDYsImV4cCI6MjA4NDYwMzcwNn0.szk1Do5oUAEg6zsqBGAIWC43zULtB1rDtmF8O9i2i9s";
        // const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // const STANDARD_PREREQUISITES = [
        //     "Business Case",
        //     "Stakeholders",
        //     "Cálculo de Ahorros",
        //     "Aprobaciones",
        //     "Project Plan",
        //     "Comunicaciones",
        //     "Traspaso a BAU"
        // ];

        let projectStatuses = [];
        let currentUser = null; // valor inicial por defecto


        // =====================================================
        // =============== FUNCIONES COMPARTIDAS ===============
        // (utilidades, helpers, actualización de campos, etc.)
        // =====================================================

        // Estado global para collapse/expand del sidebar
        let sidebarCollapsed = {
            activos: false,
            completados: false
        };

        // Función para escapar HTML y prevenir XSS
        function escapeHtml(text) {
            if (!text) return '';
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return String(text).replace(/[&<>"']/g, char => map[char]);
        }

        function getStatusIcon(status) {
            switch (status) {
                case 'Verde': return '✅';
                case 'Ámbar': return '⚠️';
                case 'Rojo': return '🚫';
                default: return '✅';
            }
        }
        
        function getStatusText(status) {
    switch (status) {
        case "Verde":
            return "On Time";
        case "Ámbar":
            return "Riesgo";
        case "Rojo":
            return "Bloqueo";
        default:
            return status || "-";
    }
}


        function toggleIndicatorDropdown(event, type) {
            event.stopPropagation();

            // Cerrar todos los dropdowns
            document.querySelectorAll('.indicator-dropdown').forEach(d => d.classList.remove('active'));

            // Abrir el dropdown específico
            const dropdown = document.getElementById(`dropdown-${type}`);
            if (dropdown) {
                dropdown.classList.add('active');
            }

            // Cerrar al hacer clic fuera
            setTimeout(() => {
                document.addEventListener('click', closeAllDropdowns, { once: true });
            }, 10);
        }

        function closeAllDropdowns() {
            document.querySelectorAll('.indicator-dropdown').forEach(d => d.classList.remove('active'));
        }

        async function updateIndicator(event, projectId, field, value) {
            event.stopPropagation();
            closeAllDropdowns();

            // Actualizar en memoria
            const project = projects.find(p => p.id === projectId);
            if (project) {
                project[field] = value;
            }

            // Guardar en base de datos
            await updateProjectField(projectId, field, value);

            // Refrescar vistas
            renderFicha();
        }


        const madridHolidays = [
            '2025-01-01', '2025-01-06',
            '2025-04-17', '2025-04-18',
            '2025-05-01', '2025-05-02',
            '2025-07-25', '2025-08-15',
            '2025-10-12', '2025-11-01', '2025-11-09',
            '2025-12-06', '2025-12-08', '2025-12-25',
            '2026-01-01', '2026-01-06',
            '2026-04-02', '2026-04-03',
            '2026-05-01', '2026-05-02',
            '2026-08-15',
            '2026-10-12', '2027-11-02',
            '2026-12-07', '2027-12-08', '2027-12-25',
            '2027-01-01', '2027-01-06',
            '2027-03-25', '2027-03-26',
            '2027-05-01',
            '2027-10-12',
            '2027-11-01',
            '2027-12-06', '2027-12-08', '2027-12-25'
        ];

        let projects = [];
        let dailyComments = [];
        let teamVacations = [];
        let selectedVacationDays = []; // Rastrear días seleccionados para vacaciones
        let currentMonth = new Date();
        const teamMembers = ['IS', 'DH', 'HR', 'PU', 'AR', 'MR']; // Ajusta según tu equipo
        let currentProjectId = null;
        let currentWeekStart = getMonday(new Date());
        let editingCommentId = null;
        let commentsListContext = { projectId: null, dateKey: null };

        let dailyFilters = {
            proyecto: '',
            estado: '',
            fechaInicio: ''
        };

        let dailyViewMode = 'activos';
        let dashboardFilters = {
    proyecto: '',
    fases: [],
    prioridades: [],
    impactos: [],
    estados: [],
    fechaInicioDesde: '',
    fechaInicioHasta: '',
    fechaFinDesde: '',
    fechaFinHasta: ''
};

let dashboardSort = {
    column: null,
    direction: 'asc'
};

let dailySort = {
    column: null,
    direction: 'asc'
};

function setDashboardFilter(field, value) {
  dashboardFilters[field] = value;
  
  // Guardar el elemento activo y su posición del cursor ANTES de re-renderizar
  const activeElement = document.activeElement;
  const isFilterInput = activeElement && activeElement.id === 'dashFilterProyecto';
  let cursorPosition = 0;
  
  if (isFilterInput) {
    cursorPosition = activeElement.selectionStart;
  }
  
  // Re-renderizar
  renderDashboard();
  
  // Restaurar el foco y la posición del cursor DESPUÉS de re-renderizar
  if (isFilterInput) {
    setTimeout(() => {
      const newInput = document.getElementById('dashFilterProyecto');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }
}



// =====================================================
// ====================== DAILY ========================
// (tabla semanal, filtros, comentarios diarios, etc.)
// =====================================================

function setDailyViewMode(mode) {
    dailyViewMode = mode;
    document.getElementById('btnDailyActivos').classList.toggle('active', mode === 'activos');
    document.getElementById('btnDailyCompletados').classList.toggle('active', mode === 'completados');
    renderDaily();
}


        function getMonday(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }

        function getWeekDates(mondayDate) {
            const dates = [];
            for (let i = 0; i < 5; i++) {
                const date = new Date(mondayDate);
                date.setDate(date.getDate() + i);
                dates.push(date);
            }
            return dates;
        }

        function previousWeek() {
            currentWeekStart = new Date(currentWeekStart);
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderDaily();
        }

        function nextWeek() {
            currentWeekStart = new Date(currentWeekStart);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderDaily();
        }

        function updateWeekInfo() {
            const dates = getWeekDates(currentWeekStart);
            if (!dates.length) return;
            const startStr = dates[0].toLocaleDateString('es-ES');
            const endStr = dates[dates.length - 1].toLocaleDateString('es-ES');
            document.getElementById('weekInfo').textContent = `${startStr} - ${endStr}`;
        }

        function openNewProjectModal() {
            document.getElementById('projectModal').classList.add('active');
        }

        function closeProjectModal() {
            // Cerrar modal
            const modal = document.getElementById('projectModal');
            if (modal) modal.classList.remove('active');

            // Limpiar campos de forma SEGURA (solo si existen)
            const fields = ['projectName', 'projectStartDate', 'projectEndDate', 'volume', 'fte', 'projectStakeholders', 'projectPhase'];
            fields.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    if (input.type === 'select-one') {
                        input.value = input.options[0]?.value || '';
                    } else {
                        input.value = '';
                    }
                }
            });
        }



        function generateId() {
            return Date.now().toString() + "-" + Math.random().toString(36).slice(2);
        }

        async function saveNewProject() {
            // LEER TODOS LOS CAMPOS (con los IDs exactos de tu modal)
            const nameInput = document.getElementById('projectName');
            const startDateInput = document.getElementById('projectStartDate');
            const endDateInput = document.getElementById('projectEndDate');
            const volumeInput = document.getElementById('volume');
            const fteInput = document.getElementById('fte');
            const phaseInput = document.getElementById('projectPhase');
            const stakeholdersInput = document.getElementById('projectStakeholders');

            // VALIDAR NOMBRE
            const name = nameInput.value.trim();
            if (!name) {
                alert('Por favor, ingresa el nombre del proyecto.');
                return;
            }

            // LEER VALORES
            const startDate = startDateInput.value || null;
            const endDate = endDateInput.value || null;
            const volume = parseFloat(volumeInput.value) || 0;
            const fte = parseFloat(fteInput.value) || 0;
            const phase = phaseInput.value;
            const stakeholders = stakeholdersInput.value.trim();

            // PRERREQUISITOS ESTÁNDAR
            const prerequisites = (typeof STANDARD_PREREQUISITES !== 'undefined' ? STANDARD_PREREQUISITES : []).map(pName => ({
                name: pName,
                done: false,
                na: false
            }));

            // OBJETO PARA SUPABASE
            const projectRow = {
                name: name,
                start_date: startDate,
                end_date: endDate,
                volume: volume,
                fte: fte,
                phase: phase,
                stakeholders: stakeholders,
                status: 'Verde',
                priority: 'Media',
                progress: 0,
                prerequisites: prerequisites
            };

            // console.log("📤 Creando proyecto:", projectRow);

            // GUARDAR EN SUPABASE
            const { data, error } = await supabaseClient
                .from('projects')
                .insert(projectRow)
                .select()
                .single();

            if (error) {
                console.error("❌ Error:", error);
                alert("Error guardando proyecto: " + error.message);
                return;
            }

            // console.log("✅ Proyecto creado:", data);

            // LIMPIAR FORMULARIO (esto evita que queden los valores marcados)
            nameInput.value = '';
            startDateInput.value = '';
            endDateInput.value = '';
            volumeInput.value = '';
            fteInput.value = '';
            stakeholdersInput.value = '';
            phaseInput.value = 'Idea'; // Resetear al valor por defecto

            // RECARGAR DATOS Y ABRIR FICHA
            await loadDataFromSupabase();

            if (data && data.id) {
                currentProjectId = data.id;
                switchView('ficha');
                renderFicha();
            }

            // CERRAR MODAL
            closeProjectModal();
        }





        function renderProjectsList() {
            const listActive = document.getElementById('projectsListActive');
            const listCompleted = document.getElementById('projectsListCompleted');
            
            if (!listActive || !listCompleted) {
                return; // Elementos no existen aún
            }

            // Limpiar y actualizar ACTIVOS
            listActive.innerHTML = '';
            listActive.className = `projects-list ${sidebarCollapsed.activos ? 'collapsed' : 'expanded'}`;
            
            projects.forEach(project => {
                if (project.phase !== 'Cerrado') {
                    const li = document.createElement('li');
                    const isActive = currentProjectId === project.id ? 'active' : '';
                    li.innerHTML = `<button onclick="selectProject('${project.id}')" class="${isActive}">${escapeHtml(project.name)}</button>`;
                    listActive.appendChild(li);
                }
            });

            // Limpiar y actualizar COMPLETADOS
            listCompleted.innerHTML = '';
            listCompleted.className = `projects-list ${sidebarCollapsed.completados ? 'collapsed' : 'expanded'}`;
            
            projects.forEach(project => {
                if (project.phase === 'Cerrado') {
                    const li = document.createElement('li');
                    const isActive = currentProjectId === project.id ? 'active' : '';
                    li.innerHTML = `<button onclick="selectProject('${project.id}')" class="${isActive}">${escapeHtml(project.name)}</button>`;
                    listCompleted.appendChild(li);
                }
            });

            const select = document.getElementById('commentProjectSelect');
            if (select) {
                select.innerHTML = '<option value="">Selecciona un proyecto...</option>';
                projects.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
            }
        }

        function toggleSidebarSection(section) {
            sidebarCollapsed[section] = !sidebarCollapsed[section];
            
            // Actualizar ícono con el atributo data-collapsed
            const titles = document.querySelectorAll('.sidebar-title');
            const titleIndex = section === 'activos' ? 0 : 1;
            if (titles[titleIndex]) {
                const icon = titles[titleIndex].querySelector('.section-toggle-icon');
                if (icon) {
                    icon.setAttribute('data-collapsed', sidebarCollapsed[section] ? 'true' : 'false');
                }
            }
            
            renderProjectsList();
        }

        function selectProject(projectId) {
            currentProjectId = projectId;

            // Detectar si el proyecto seleccionado es completado
            const selectedProject = projects.find(p => p.id === projectId);
            if (selectedProject) {
                // Si está en vista Daily, cambiar automáticamente el modo según el estado del proyecto
                const isDailyView = document.querySelector('.daily-view.active');
                if (isDailyView) {
                    if (selectedProject.phase === 'Cerrado') {
                        setDailyViewMode('completados');
                    } else {
                        setDailyViewMode('activos');
                    }
                }
            }

            renderProjectsList();

            const currentView = document.querySelector('.daily-view.active') ? 'daily' : 'ficha';
            if (currentView === 'ficha') {
                renderFicha();
            } else {
                renderDaily();
            }
        }


        function formatDateDisplay(isoDate) {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            if (isNaN(d)) return isoDate;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }

        function formatDateKey(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function renderDaily() {
            // 1. Si no hay proyectos en absoluto (base de datos vacía), mostrar mensaje inicial
            if (!projects.length) {
                document.getElementById('dailyTableContainer').innerHTML = '<div class="empty-state">Crea un proyecto para empezar a usar la daily.</div>';
                return;
            }

            updateWeekInfo();
            const weekDates = getWeekDates(currentWeekStart);

            const estadosUnicos = Array.from(
                new Set(projects.map(p => p.phase || 'Sin fase'))
            ).filter(x => x);

            // Aplicar filtros
            let filteredProjects = projects.filter(p =>
                dailyViewMode === 'activos'
                    ? p.phase !== 'Cerrado'
                    : p.phase === 'Cerrado'
            );

            if (dailyFilters.proyecto && dailyFilters.proyecto.trim()) {
                const txt = dailyFilters.proyecto.trim().toLowerCase();
                filteredProjects = filteredProjects.filter(p =>
                    (p.name || '').toLowerCase().includes(txt)
                );
            }

            if (dailyFilters.estado && dailyFilters.estado.trim()) {
                const estadoFiltro = dailyFilters.estado.trim();
                filteredProjects = filteredProjects.filter(
                    p => (p.phase || 'Sin fase') === estadoFiltro
                );
            }

            if (dailyFilters.fechaInicio) {
  filteredProjects = filteredProjects.filter(p => 
    p.startDate && p.startDate.slice(0, 10) >= dailyFilters.fechaInicio
  );
}


            // <--- CAMBIO 1: ELIMINADO EL BLOQUE QUE RETORNABA EARLY SI NO HABÍA RESULTADOS
            // (Antes aquí había un if (!filteredProjects.length) { ... return; } que borraba la tabla)

            let html = '<table class="daily-table"><thead>';

            const tituloTabla = dailyViewMode === 'activos' ? 'Proyecto (activos)' : 'Proyecto (completados)';
            html += `<tr><th onclick="toggleDailySort('name')" class="sortable-header">${tituloTabla} ${getSortIndicatorDaily('name')}</th><th onclick="toggleDailySort('status')" class="sortable-header">Estado ${getSortIndicatorDaily('status')}</th><th onclick="toggleDailySort('startDate')" class="sortable-header">Fecha inicio ${getSortIndicatorDaily('startDate')}</th>`;

            weekDates.forEach((date) => {
                const dateKey = date.toISOString().slice(0, 10);
                const isToday = dateKey === new Date().toISOString().slice(0, 10);
                const isHoliday = madridHolidays.includes(dateKey);

                const dayNameRaw = date.toLocaleDateString('es-ES', { weekday: 'long' });
                const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
                const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' });

                let headerClass = 'day-header';
                if (isToday) {
                    headerClass += ' today-header';
                }
                if (isHoliday) {
                    headerClass += ' holiday-header';
                }

                const holidayBadge = isHoliday ? '<span style="position:absolute;top:4px;right:6px;font-size:9px;color:#d32f2f;font-weight:700;">FESTIVO</span>' : '';

                html += `<th class="${headerClass}" style="position:relative;">${holidayBadge}${dayName}<br>${dateStr}</th>`;
            });

            html += '</tr>';

            // FILA DE FILTROS (Se dibuja siempre)
            html += '<tr class="filter-row">';

            html += '<th><input class="filter-input" type="text" placeholder="Filtrar..." ' +
                'value="' + dailyFilters.proyecto + '" ' +
                'oninput="onFilterChange(\'proyecto\', this.value)"></th>';

            html += '<th><select class="filter-select" onchange="onFilterChange(\'estado\', this.value)">' +
                '<option value="">Todos</option>';
            estadosUnicos.forEach(est => {
                const sel = dailyFilters.estado === est ? 'selected' : '';
                html += '<option value="' + est + '" ' + sel + '>' + est + '</option>';
            });
            html += '</select></th>';

            html += '<th><input class="filter-input" type="date" ' +
                'value="' + dailyFilters.fechaInicio + '" ' +
                'oninput="onFilterChange(\'fechaInicio\', this.value || \'\')"></th>'; // <--- OJO: Asegúrate de manejar el string vacío

            weekDates.forEach(date => {
                const dateKey = formatDateKey(date);
                const usersOnVacation = teamVacations
                    .filter(v => dateKey >= v.start_date && dateKey <= v.end_date)
                    .map(v => v.user_initials)
                    .filter((value, index, self) => self.indexOf(value) === index);

                const vacationBadges = usersOnVacation.map(user =>
                    `<span class="vacation-badge">${user}</span>`
                ).join('');

                html += `<th style="padding: 3px 2px;">${vacationBadges}</th>`;
            });

            html += `</tr>`;
            html += `</thead><tbody>`;

            // <--- CAMBIO 2: MANEJO DE SIN RESULTADOS DENTRO DEL BODY
            if (!filteredProjects.length) {
                // Calculamos colspan: 3 columnas fijas + 5 días de la semana = 8
                const label = dailyViewMode === 'activos' ? 'activos' : 'completados';
                html += `<tr>
                        <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                            No hay proyectos ${label} que cumplan los filtros seleccionados.
                        </td>
                     </tr>`;
            } else {
                // Aplicar ordenamiento
                const sortedProjects = sortDailyProjects(filteredProjects);
                
                // Renderizado normal de filas si hay resultados
                sortedProjects.forEach(project => {
                    const selectedClass = project.id === currentProjectId ? 'selected-row' : '';
                    html += `<tr class="${selectedClass}" onclick="onRowClick('${project.id}')">
                    <td class="project-name-cell" onclick="onProjectNameClick(event, '${project.id}')">${escapeHtml(project.name)}</td>
                    <td>
                        <select class="state-select"
                                onclick="event.stopPropagation()"
                                onchange="updateProjectPhaseFromDaily(event, '${project.id}')">
                            <option value="Idea" ${project.phase === 'Idea' ? 'selected' : ''}>Idea</option>
                            <option value="En Progreso" ${project.phase === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="On Hold" ${project.phase === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Cerrado" ${project.phase === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>
                    </td>
                    <td>${formatDateDisplay(project.startDate)}</td>`;

                    weekDates.forEach((date) => {
                        const dayNum = String(date.getDate()).padStart(2, '0');
                        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
                        const dateKey = `${date.getFullYear()}-${monthNum}-${dayNum}`;

                        const cellComments = dailyComments.filter(c =>
                            c.projectId === project.id && c.date === dateKey
                        );
                        const hasCells = cellComments.length > 0;
                        const isHoliday = madridHolidays.includes(dateKey);
                        const isToday = dateKey === new Date().toISOString().slice(0, 10);
                        const baseClass = hasCells ? 'daily-cell has-comment' : 'daily-cell';
                        const holidayClass = isHoliday ? ' holiday-cell' : '';
                        const todayClass = isToday ? ' today-cell' : '';
                        const cellClass = baseClass + holidayClass + todayClass;

                        let previewText = '';
                        let metaText = '';
                        if (hasCells) {
                            const latest = cellComments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                            const shortText = latest.text.length > 60 ? latest.text.slice(0, 60) + '…' : latest.text;
                            previewText = shortText.replace(/\n/g, ' ');
                            metaText = `${cellComments.length} comentario(s) · ${latest.urgency}${latest.hasIncident ? ' · INCIDENCIA' : ''}`;
                        }

                        html += `<td class="${cellClass}">
                        <div class="daily-cell-content">
                            <div class="daily-cell-preview">${previewText}</div>
                            ${metaText ? `<div class="daily-cell-meta">${metaText}</div>` : ''}
                            <div class="daily-actions">
                                ${hasCells ? `<button class="daily-action-btn" onclick="openCommentsList(event, '${project.id}', '${dateKey}')">Ver</button>` : ''}
                                <button class="daily-action-btn" onclick="openDailyCommentModalFromCell(event, '${project.id}', '${dateKey}')">+</button>
                            </div>
                        </div>
                    </td>`;
                    });

                    html += '</tr>';
                });
            }

            html += '</tbody></table>';
            document.getElementById('dailyTableContainer').innerHTML = html;
        }


        function onRowClick(projectId) {
            currentProjectId = projectId;
            renderProjectsList();
            renderDaily();
        }

        function onProjectNameClick(event, projectId) {
            event.stopPropagation();
            goToFichaFromDaily(projectId);
        }

        function goToFichaFromDaily(projectId) {
            currentProjectId = projectId;
            renderProjectsList();
            switchView('ficha');
        }

        function onFilterChange(field, value) {
  dailyFilters[field] = value;
  
  // Guardar el elemento activo y su posición del cursor ANTES de re-renderizar
  const activeElement = document.activeElement;
  const isFilterInput = activeElement && activeElement.classList.contains('filter-input') && activeElement.type === 'text';
  let cursorPosition = 0;
  
  if (isFilterInput) {
    cursorPosition = activeElement.selectionStart;
  }
  
  // Re-renderizar
  renderDaily();
  
  // Restaurar el foco y la posición del cursor DESPUÉS de re-renderizar
  if (isFilterInput) {
    setTimeout(() => {
      const newInput = document.querySelector('.filter-input[type="text"]');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }
}


       async function updateProjectPhaseFromDaily(event, projectId) {
    event.stopPropagation();
    const newPhase = event.target.value;
    
    // 1. Actualizar en memoria local
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.phase = newPhase;
    }
    
    // 2. Guardar en base de datos PRIMERO
    await updateProjectField(projectId, "phase", newPhase);
    
    // 3. Cambiar vista según el nuevo estado
    if (newPhase === "Cerrado") {
        dailyViewMode = "completados";
        document.getElementById("btnDailyActivos").classList.remove("active");
        document.getElementById("btnDailyCompletados").classList.add("active");
    } else {
        dailyViewMode = "activos";
        document.getElementById("btnDailyActivos").classList.add("active");
        document.getElementById("btnDailyCompletados").classList.remove("active");
    }
    
    // 4. Refrescar la vista DESPUÉS de guardar
    renderDaily();
}





        function openDailyCommentModalFromCell(event, projectId, dateKey) {
            event.stopPropagation();
            editingCommentId = null;
            openDailyCommentModal(dateKey, projectId);
        }

        function openDailyCommentModal(dateKey, projectIdOverride = null) {
            document.getElementById('dailyModal').classList.add('active');
            document.getElementById('dailyModalTitle').textContent = editingCommentId ? 'Editar comentario Daily' : 'Nuevo comentario Daily';

            const select = document.getElementById('commentProjectSelect');
            select.innerHTML = '<option value="">Selecciona un proyecto...</option>';
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                if (p.id === (projectIdOverride || currentProjectId)) opt.selected = true;
                select.appendChild(opt);
            });
            document.getElementById('dailyModal').dataset.dateKey = dateKey;

            if (editingCommentId) {
                const comment = dailyComments.find(c => c.id === editingCommentId);
                if (comment) {
                    document.getElementById('commentProjectSelect').value = comment.projectId;
                    document.getElementById('commentResponsible').value = comment.responsible || '';
                    document.getElementById('commentUrgency').value = comment.urgency;
                    document.getElementById('commentIncident').checked = comment.hasIncident;
                    document.getElementById('commentText').value = comment.text;
                }
            } else {
                document.getElementById('commentResponsible').value = '';
                document.getElementById('commentUrgency').value = 'Normal';
                document.getElementById('commentIncident').checked = false;
                document.getElementById('commentText').value = '';
            }
        }

        function closeDailyModal() {
            document.getElementById('dailyModal').classList.remove('active');
            document.getElementById('commentText').value = '';
            document.getElementById('commentResponsible').value = '';
            document.getElementById('commentUrgency').value = 'Normal';
            document.getElementById('commentIncident').checked = false;
            editingCommentId = null;
        }

        function updateAvailableTasks() {
        }

        async function saveDailyComment() {
            const projectId = document.getElementById('commentProjectSelect').value;
            const responsible = document.getElementById('commentResponsible').value.trim();
            const urgency = document.getElementById('commentUrgency').value;
            const hasIncident = document.getElementById('commentIncident').checked;
            const text = document.getElementById('commentText').value.trim();
            const dateKey = document.getElementById('dailyModal').dataset.dateKey;

            // console.log('Guardando comentario...', { projectId, text, editingCommentId });

            if (!projectId || !text) {
                alert('Por favor, completa los campos obligatorios.');
                return;
            }

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            const wasEditing = !!editingCommentId;
            const savedProjectId = projectId;
            const savedDateKey = dateKey;

            if (editingCommentId) {
                // console.log('Actualizando comentario existente:', editingCommentId);
                const { data, error } = await supabaseClient
                    .from('daily_comments')
                    .update({
                        project_id: projectId,
                        date: dateKey,
                        time: timeStr,
                        responsible,
                        urgency,
                        has_incident: hasIncident,
                        text
                    })
                    .eq('id', editingCommentId)
                    .select();

                // console.log('Resultado UPDATE:', { data, error });

                if (error) {
                    console.error(error);
                    alert('Error actualizando comentario');
                    return;
                }

                if (!data || data.length === 0) {
                    console.error('UPDATE no afectó ninguna fila');
                    alert('No se encontró el comentario para actualizar');
                    return;
                }
            } else {
                // console.log('Insertando nuevo comentario');
                const newId = generateId();
                const { error } = await supabaseClient
                    .from('daily_comments')
                    .insert({
                        id: newId,
                        project_id: projectId,
                        date: dateKey,
                        time: timeStr,
                        responsible,
                        urgency,
                        has_incident: hasIncident,
                        user_name: currentUser,
                        text
                    });

                if (error) {
                    console.error(error);
                    alert('Error guardando comentario');
                    return;
                }
            }

            if (urgency === 'Máxima') {
                alert(`⚠️ URGENCIA MÁXIMA\nEnviando notificación a: ${responsible || 'responsable no especificado'}`);
            }

            closeDailyModal();

            // console.log('Recargando datos... wasEditing:', wasEditing);
            await loadDataFromSupabase(true);

            if (wasEditing) {
                // console.log('Reabriendo lista de comentarios para:', savedProjectId, savedDateKey);
                openCommentsList(new Event('click'), savedProjectId, savedDateKey);
            } else {
                renderFicha();
            }
        }





        function openCommentsList(event, projectId, dateKey) {
            event.stopPropagation();
            commentsListContext.projectId = projectId;
            commentsListContext.dateKey = dateKey;

            const comments = dailyComments
                .filter(c => c.projectId === projectId && c.date === dateKey)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const container = document.getElementById('commentsListContainer');
            if (comments.length === 0) {
                container.innerHTML = '<div class="empty-state" style="padding: 12px;">Sin comentarios para este día.</div>';
            } else {
                let html = `<div class="comments-box">`;
                comments.forEach(c => {
                    const dateObj = new Date(c.date + 'T00:00:00');
                    const dd = String(dateObj.getDate()).padStart(2, '0');
                    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const yy = String(dateObj.getFullYear()).slice(-2);
                    const formattedDate = `${dd}/${mm}/${yy}`;

                    const completedClass = c.completed ? 'completed' : '';
                    const completedBadge = c.completed ? '<span class="completion-badge">✓ COMPLETADA</span>' : '';

                    html += `<div class="comment-entry ${completedClass}">
                <div class="comment-checkbox-wrapper">
                    <input type="checkbox" class="comment-checkbox" 
                           ${c.completed ? 'checked' : ''}
                           onclick="toggleCommentCompletion(event, '${c.id}')">
                    <div style="flex: 1;">
                        <div class="comment-header">${formattedDate} [${escapeHtml(c.userName || "ND")}]${completedBadge}</div>
                        <div class="comment-meta">Resp: [${escapeHtml(c.responsible || 'ND')}]</div>
                        <div class="comment-text">${escapeHtml(c.text).replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn" onclick="editComment('${c.id}')">✏️ Editar</button>
                    <button class="comment-action-btn" onclick="deleteComment('${c.id}')">🗑️ Borrar</button>
                </div>
            </div>`;
                });

                html += '</div>';
                container.innerHTML = html;
            }

            document.getElementById('commentsListModal').classList.add('active');
        }

        // ========== AÑADIR AQUÍ LA NUEVA FUNCIÓN ==========
        async function toggleCommentCompletion(event, commentId) {
            event.stopPropagation();

            const comment = dailyComments.find(c => c.id === commentId);
            if (!comment) return;

            const newCompletedState = !comment.completed;

            const { error } = await supabaseClient
                .from('daily_comments')
                .update({ completed: newCompletedState })
                .eq('id', commentId);

            if (error) {
                console.error(error);
                alert('Error actualizando estado de completado');
                return;
            }

            // Actualizar en memoria y re-renderizar
            comment.completed = newCompletedState;

            const { projectId, dateKey } = commentsListContext;
            if (projectId && dateKey) {
                openCommentsList(new Event('click'), projectId, dateKey);
            }
        }

        async function toggleCommentCompletionFromFicha(event, commentId) {
            event.stopPropagation();

            const comment = dailyComments.find(c => c.id === commentId);
            if (!comment) return;

            const newCompletedState = !comment.completed;

            const { error } = await supabaseClient
                .from('daily_comments')
                .update({ completed: newCompletedState })
                .eq('id', commentId);

            if (error) {
                console.error(error);
                alert('Error actualizando estado de completado');
                return;
            }

            // Actualizar en memoria y re-renderizar la ficha
            comment.completed = newCompletedState;
            renderFicha();
        }

        // ===================================================

        function closeCommentsListModal() {
            document.getElementById('commentsListModal').classList.remove('active');
        }

        function openAddCommentFromList() {
            const { projectId, dateKey } = commentsListContext;
            editingCommentId = null;
            closeCommentsListModal();
            openDailyCommentModal(dateKey, projectId);
        }

        function editComment(commentId) {
            // console.log('Editando comentario:', commentId);
            editingCommentId = commentId;
            const comment = dailyComments.find(c => c.id === commentId);
            if (!comment) {
                console.error('Comentario no encontrado:', commentId);
                return;
            }
            // console.log('Comentario encontrado:', comment);
            closeCommentsListModal();
            openDailyCommentModal(comment.date, comment.projectId);
        }


        async function deleteComment(commentId) {
            const confirmed = confirm('¿Seguro que quieres borrar este comentario?');
            if (!confirmed) return;

            const { projectId, dateKey } = commentsListContext;

            const { error } = await supabaseClient
                .from('daily_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                console.error(error);
                alert('Error borrando comentario');
                return;
            }

            // Recargar datos SIN cerrar el modal
            await loadDataFromSupabase(true); // skipRender = true

            // Reabrir la lista actualizada
            if (projectId && dateKey) {
                openCommentsList(new Event('click'), projectId, dateKey);
            }
        }



        async function updateProjectField(projectId, field, value) {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            let update = {};
            switch (field) {
                case 'name':
                    update.name = value;
                    project.name = value;
                    renderSidebar();
                    break;
                case 'startDate':
                    update.start_date = value || null;
                    project.startDate = value || null;
                    break;
                case 'endDate':
                    update.end_date = value || null;
                    project.endDate = value || null;
                    break;
case "phase":
    update = { phase: value };
    project.phase = value;
    break;

                case 'volume':
                    update.volume = value;
                    project.volume = value;
                    break;
                case 'stakeholders':
                    update.stakeholders = value;
                    project.stakeholders = value;
                    break;
                case 'benefits':
                    update.benefits = value;
                    project.benefits = value;
                    break;
                case 'progress':  // <--- ¡ESTO ES LO QUE FALTABA!
                    update.progress = value;
                    project.progress = value;
                    break;
                case 'prerequisites':
                    update.prerequisites = value;
                    project.prerequisites = value;
                    break;
                case 'priority':
                    update.priority = value;
                    project.priority = value;
                    break;
                case 'impact':
                    update.impact = value;
                    project.impact = value;
                    break;
                case 'status':
                    update.status = value;
                    project.status = value;
                    break;
                case 'fte':
                    const fteVal = parseFloat(value) || 0;
                    update.fte = fteVal;   // <--- ESTO ES CRUCIAL (minúsculas)
                    project.fte = fteVal;  // Actualización local (lo que ves en consola)
                    break;


            }



            // Actualización optimista en UI (ya hecha arriba en 'project')

            // Enviar a Supabase
            const { error } = await supabaseClient
                .from('projects')
                .update(update)
                .eq('id', projectId);

            if (error) {
                console.error('Error updating project field:', error);
                alert('Error al guardar el campo ' + field);
            } else {
                // Opcional: recargar para asegurar sincronía, pero no estrictamente necesario si la optimista funciona
                // await loadProjects(); 
            }
        }


        async function updateProjectProgress(projectId, value) {
    let progress = parseInt(value);
    if (isNaN(progress)) progress = 0;
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;

    // Llamar a updateProjectField para guardar
    await updateProjectField(projectId, 'progress', progress);

    // Refrescar visualmente
    renderFicha();
}

function handleProgressWheel(event, projectId, currentValue) {
    event.preventDefault();

    const delta = event.deltaY < 0 ? 5 : -5; // sube/baja de 5 en 5
    let value = parseInt(currentValue, 10);
    if (isNaN(value)) value = 0;

    let newValue = value + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > 100) newValue = 100;

    const input = document.getElementById(`progressInput${projectId}`);
    if (input) {
        input.value = newValue;
    }

    updateProjectProgress(projectId, newValue);
}


// =====================================================
// ================= CAPACIDAD SEMANAL =================
// (capacidad por semana y miembro del equipo)
// =====================================================

let capacityWeekStart = getMonday(new Date());
let projectCapacities = [];

async function loadCapacities() {
    const { data, error } = await supabaseClient
        .from('project_capacities')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    projectCapacities = (data || []).map(c => ({
        id: c.id,
        projectId: c.project_id,
        userInitials: c.user_initials,
        weekStart: c.week_start,
        capacityPercent: c.capacity_percent || 0
    }));
}

function renderCapacityWidget() {
    if (!currentProjectId) return '';

    const week1Start = new Date(capacityWeekStart);
    const week2Start = new Date(capacityWeekStart);
    week2Start.setDate(week2Start.getDate() + 7);

    const formatWeek = (date) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 4);
        return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    };

            let html = `<div class='widget-box' id='capacityWidget'>
        <div class='widget-header'>
            <div class="widget-title">💼 Capacidad Semanal</div>
        </div>
        
        <div class="capacity-week-nav">
            <button onclick="previousCapacityWeek()">◀</button>
            <div class="capacity-week-info">${formatWeek(week1Start)}</div>
            <button onclick="nextCapacityWeek()">▶</button>
        </div>
        
        <div class="capacity-weeks-container">`;

            // Semana actual
            html += renderWeekBlock(week1Start, 'Semana Actual');

            // Semana siguiente
            html += renderWeekBlock(week2Start, 'Semana Siguiente');

            html += `</div></div>`;
            return html;
        }

        function renderWeekBlock(weekStart, label) {
            const weekKey = formatDateKey(weekStart);

            let html = `<div class="capacity-week-block">
        <div class="capacity-week-label">${label}</div>`;

            teamMembers.forEach(user => {
                const existing = projectCapacities.find(c =>
                    c.projectId === currentProjectId &&
                    c.userInitials === user &&
                    c.weekStart === weekKey
                );

                const value = existing ? existing.capacityPercent : 0;

                html += `<div class="capacity-user-row">
            <div class="capacity-user-icon">${user}</div>
            <div class="capacity-input-wrapper">
                <input type="number" 
                       class="capacity-input" 
                       value="${value}" 
                       min="0" 
                       max="100"
                       onchange="updateCapacity('${user}', '${weekKey}', this.value)"
                       placeholder="0">
                <span class="capacity-percent-symbol">%</span>
            </div>
        </div>`;
            });

            html += `</div>`;
            return html;
        }

        async function updateCapacity(userInitials, weekStart, value) {
            let capacity = parseInt(value);
            if (isNaN(capacity)) capacity = 0;
            if (capacity < 0) capacity = 0;
            if (capacity > 100) capacity = 100;

            const existingIndex = projectCapacities.findIndex(c =>
                c.projectId === currentProjectId &&
                c.userInitials === userInitials &&
                c.weekStart === weekStart
            );

            if (existingIndex >= 0) {
                // Actualizar
                projectCapacities[existingIndex].capacityPercent = capacity;

                const { error } = await supabaseClient
                    .from('project_capacities')
                    .update({ capacity_percent: capacity })
                    .eq('id', projectCapacities[existingIndex].id);

                if (error) console.error(error);
            } else {
                // Crear
                const newId = generateId();
                const newCapacity = {
                    id: newId,
                    projectId: currentProjectId,
                    userInitials,
                    weekStart,
                    capacityPercent: capacity
                };

                projectCapacities.push(newCapacity);

                const { error } = await supabaseClient
                    .from('project_capacities')
                    .insert({
                        id: newId,
                        project_id: currentProjectId,
                        user_initials: userInitials,
                        week_start: weekStart,
                        capacity_percent: capacity
                    });

                if (error) console.error(error);
            }

            renderCapacityWidgetInPlace();
        }

        function previousCapacityWeek() {
            capacityWeekStart.setDate(capacityWeekStart.getDate() - 7);
            renderCapacityWidgetInPlace();
        }

        function nextCapacityWeek() {
            capacityWeekStart.setDate(capacityWeekStart.getDate() + 7);
            renderCapacityWidgetInPlace();
        }

        function renderCapacityWidgetInPlace() {
            const existing = document.getElementById('capacityWidget');
            if (existing) {
                const parent = existing.parentElement;
                existing.remove();
                parent.insertAdjacentHTML('afterbegin', renderCapacityWidget());
            }
        }


        function closeCapacityWidget() {
            const widget = document.getElementById('capacityWidget');
            if (widget) widget.remove();
        }




        // 1. Función para cargar estados desde Supabase
        async function loadProjectStatuses() {
    const { data, error } = await supabaseClient
        .from('project_statuses')
        .select()
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando estados:', error);
        return;
    }

    // CONVERSIÓN CORRECTA de snake_case (DB) a camelCase (App)
    projectStatuses = data.map(s => ({
        id: s.id,
        projectId: s.project_id,        // ← De project_id a projectId
        statusText: s.status_text,      // ← De status_text a statusText
        userInitials: s.user_initials,  // ← De user_initials a userInitials
        createdAt: s.created_at         // ← De created_at a createdAt
    }));
}


        // Función para pintar el widget con Historial y Scroll
function renderLastStatusWidget() {
    if (!currentProjectId) return '';

    const allStatuses = (projectStatuses || [])
        .filter(s => s.projectId === currentProjectId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));  // ← CORREGIDO

    const last = allStatuses[0];
    const older = allStatuses.slice(1);

    let html = `
    <div class="widget-box" style="display:flex; flex-direction:column;">
        <div class="capacity-widget-header">
            <div class="capacity-widget-title">📢 Último Estado</div>
        </div>
        
        <div id="status-display-area">`;

    if (last) {
    const d = new Date(last.createdAt);
    const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    
    html += `
    <div class="current-status-highlight">
        <div class="status-meta" style="color:#7a1ea2; font-weight:bold; margin-bottom:8px; font-size:11px;">
            ${dateStr} - ${last.userInitials}
        </div>
        <div class="status-content" style="font-size:13px; color:#333; line-height:1.4;">${last.statusText}</div>
    </div>`;
    } else {
        html += `<div class="empty-state" style="padding:10px;">No hay estados registrados.</div>`;
    }

    if (older.length > 0) {
        html += `
        <div style="font-size:10px; font-weight:bold; color:#888; margin-bottom:5px; text-transform:uppercase;">
            Historial Anterior
        </div>
        <div class="status-history-container">`;
        
        older.forEach(s => {
            const d = new Date(s.createdAt);  // ← CORREGIDO
            const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            
            html += `
            <div class="history-item">
                <div class="status-meta" style="display:flex; justify-content:space-between; font-size:10px; color:#999; margin-bottom:2px;">
                    <span>${dateStr}</span>
                    <span>${s.userInitials}</span>
                </div>
                <div style="color:#555; font-size:11px;">${s.statusText}</div>
            </div>`;
        });
        
        html += `</div>`;
    }

    html += `</div>`;

    html += `
        <div class="status-input-area" style="margin-top:auto; padding-top:10px; border-top:1px solid #eee;">
            <textarea id="newStatusTextWidget" placeholder="Escribe una actualización..."></textarea>
            <button class="btn-save-status" onclick="saveProjectStatus()">Publicar</button>
        </div>
    </div>`;

    return html;
}




        // 3. Función para guardar
        async function saveProjectStatus() {
    // Buscar el textarea con el ID correcto
    const textarea = document.getElementById('newStatusTextWidget');
    const text = textarea ? textarea.value.trim() : '';
    
    if (!text) {
        alert('Por favor escribe algo');
        return;
    }

    const newStatus = {
        id: generateId(),
        project_id: currentProjectId,
        status_text: text,
        user_initials: currentUser || 'US',
        created_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from('project_statuses')
        .insert(newStatus);
        
    if (error) {
        console.error(error);
        alert('Error al guardar');
        return;
    }

    projectStatuses.unshift({
        id: newStatus.id,
        projectId: newStatus.project_id,
        statusText: newStatus.status_text,
        userInitials: newStatus.user_initials,
        createdAt: newStatus.created_at
    });

    if (textarea) textarea.value = '';
    renderFicha();
}





        // =====================================================
        // ================= FICHA DE PROYECTO =================
        // (detalle, progreso, prerrequisitos, comentarios, etc.)
        // =====================================================


        function renderFicha() {
            if (!currentProjectId) {
                document.getElementById('fichaView').innerHTML = `<div class="empty-state">Selecciona un proyecto para ver su ficha.</div>`;
                return;
            }

            const project = projects.find(p => p.id === currentProjectId);
            if (!project) {
                document.getElementById('fichaView').innerHTML = `<div class="empty-state">Proyecto no encontrado.</div>`;
                return;
            }

            // Calcular progreso
            const progressPercent = project.progress || 0;
            const lightness = 75 - (progressPercent * 0.45);
            const progressColor = `hsl(280, 60%, ${lightness}%)`;

            // --- Render Principal ---
            let html = `<div class="ficha-header">
    <div class="project-meta-row">
        <div class="project-title-section">
            <div class="ficha-title">${escapeHtml(project.name)}
                <span class="project-mini-indicators">
                    <span class="mini-indicator priority-${(project.priority || 'Media').toLowerCase()}" onclick="toggleIndicatorDropdown(event, 'priority')">
                        <span class="mini-label">Prioridad:</span>
                        <span class="mini-value">${project.priority || 'Media'}</span>
                        <div class="indicator-dropdown" id="dropdown-priority">
                            <div class="indicator-option ${project.priority === 'Baja' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'priority', 'Baja')">Baja</div>
                            <div class="indicator-option ${(project.priority || 'Media') === 'Media' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'priority', 'Media')">Media</div>
                            <div class="indicator-option ${project.priority === 'Alta' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'priority', 'Alta')">Alta</div>
                        </div>
                    </span>
                    <span class="mini-indicator impact-${(project.impact || 'Medio').toLowerCase()}" onclick="toggleIndicatorDropdown(event, 'impact')">
                        <span class="mini-label">Impacto:</span>
                        <span class="mini-value">${project.impact || 'Medio'}</span>
                        <div class="indicator-dropdown" id="dropdown-impact">
                            <div class="indicator-option ${project.impact === 'Bajo' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'impact', 'Bajo')">Bajo</div>
                            <div class="indicator-option ${(project.impact || 'Medio') === 'Medio' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'impact', 'Medio')">Medio</div>
                            <div class="indicator-option ${project.impact === 'Alto' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'impact', 'Alto')">Alto</div>
                        </div>
                    </span>
                </span>
            </div>
        </div>
        
        <!-- Círculo de Progreso Final (Centrado y funcional) -->
        <div class="progress-indicator-centered">
            <div class="progress-indicator">
                <svg class="progress-ring" width="60" height="60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="26" stroke-width="5" />
                    <circle class="progress-ring-progress" cx="30" cy="30" r="26" stroke-width="5"
                            style="stroke-dasharray: 163; stroke-dashoffset: ${163 - (163 * progressPercent / 100)}; stroke: ${progressColor}" />
                </svg>
                
                <div class="progress-text" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                    <!-- Input numérico + Símbolo % -->
                    <div style="display: flex; align-items: center; justify-content: center; transform: translateX(-3px);">
                        <input type="number" 
                               class="progress-input" 
                               value="${progressPercent}" 
                               min="0" 
                               max="100" 
                               id="progressInput${project.id}"
                               style="width: 28px; text-align: right; padding: 0; font-size: 14px; border: none; background: transparent; color: var(--color-primary); font-weight: 700;"
                               onchange="updateProjectProgress('${project.id}', this.value)"
                               onwheel="handleProgressWheel(event, '${project.id}', this.value)"
                               onclick="this.select()" />
                        <span style="font-size: 10px; font-weight: 700; color: var(--color-primary); margin-left: 1px;">%</span>
                    </div>
                    <span class="progress-label" style="font-size: 6px; margin-top: 0; transform: translateX(-1px);">AVANCE</span>
                </div>
            </div>
        </div>
        
        <div class="status-badge-container">
            <div class="status-badge status-${(project.status || 'Verde').toLowerCase()}" onclick="toggleIndicatorDropdown(event, 'status')">
                <span class="status-icon">${getStatusIcon(project.status || 'Verde')}</span>
                <span class="status-text">${getStatusText(project.status || "Verde")}</span>
                <div class="indicator-dropdown" id="dropdown-status">
                    <div class="indicator-option ${(project.status || 'Verde') === 'Verde' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'status', 'Verde')">✅ On Time</div>
                    <div class="indicator-option ${project.status === 'Ámbar' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'status', 'Ámbar')">⚠️ Riesgo</div>
                    <div class="indicator-option ${project.status === 'Rojo' ? 'selected' : ''}" onclick="updateIndicator(event, '${project.id}', 'status', 'Rojo')">🚫 Bloqueo</div>
                </div>
            </div>
        </div>
    </div>

    <div class="ficha-row">
        <div class="ficha-field">
            <div class="ficha-label">Fecha inicio</div>
            <div class="ficha-value">
                <input type="date" value="${project.startDate || ''}" onchange="updateProjectField('${project.id}','startDate', this.value)">
            </div>
        </div>
        <div class="ficha-field">
            <div class="ficha-label">Fecha fin</div>
            <div class="ficha-value">
                <input type="date" value="${project.endDate || ''}" onchange="updateProjectField('${project.id}','endDate', this.value)">
            </div>
        </div>
    </div>
    <div class="ficha-row">
        <div class="ficha-field">
            <div class="ficha-label">Fase</div>
            <div class="ficha-value">
                <select onchange="updateProjectField('${project.id}','phase', this.value)">
                    <option value="Idea" ${project.phase === 'Idea' ? 'selected' : ''}>Idea</option>
                    <option value="En Progreso" ${project.phase === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                    <option value="On Hold" ${project.phase === 'On Hold' ? 'selected' : ''}>On Hold</option>
                    <option value="Cerrado" ${project.phase === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                </select>
            </div>
        </div>
        <div class="ficha-field">
            <div class="ficha-label">Ahorro (€)</div>
            <div class="ficha-value">
                <input type="number" 
                       placeholder="0.00" 
                       step="0.01" 
                       min="0"
                       value="${project.volume || ''}" 
                       onchange="updateProjectField('${project.id}','volume', this.value)">
            </div>
        </div>
    </div>
    <div class="ficha-row">
        <div class="ficha-field">
            <div class="ficha-label">Stakeholders</div>
            <div class="ficha-value">
                <input type="text" value="${escapeHtml(project.stakeholders || '')}" onchange="updateProjectField('${project.id}','stakeholders', this.value)">
            </div>
        </div>
        <div class="ficha-field">
        <div class="ficha-field">
            <div class="ficha-label">Ahorro (FTE) </div>
            <div class="ficha-value">
                <input type="number" 
                       placeholder="0.0" 
                       step="0.1" 
                       min="0"
                       value="${project.fte || ''}" 
                       onchange="updateProjectField('${project.id}','fte', this.value)">
            </div>
        </div>
</div>`;

            // Prerrequisitos
            if (project.prerequisites && project.prerequisites.length > 0) {
                html += `<div class="ficha-section">
        <h3 class="section-title">Prerrequisitos y Documentación</h3>
        <div class="checkbox-group-2col">`;

                // 1. Obtenemos lo que tiene guardado el proyecto actualmente
                let currentPrereqs = project.prerequisites || [];

                // 2. Iteramos SIEMPRE sobre la lista estándar (para asegurar el orden y que salgan todos)
                STANDARD_PREREQUISITES.forEach((stdName, index) => {

                    // Buscamos si el proyecto ya tiene datos guardados para este item
                    // Si no los tiene, usamos valores por defecto (false)
                    const savedItem = currentPrereqs.find(p => p.name === stdName) || { done: false, na: false };

                    const isDone = savedItem.done;
                    const isNa = savedItem.na; // Nuevo valor N/A

                    // Clases CSS condicionales
                    let labelClass = '';
                    if (isDone) labelClass = 'completed';
                    else if (isNa) labelClass = 'na-active';

                    // Si es N/A, hacemos la fila un poco transparente
                    const rowStyle = isNa ? 'opacity: 0.6;' : '';
                    // Si es N/A, deshabilitamos el checkbox principal
                    const mainDisabled = isNa ? 'disabled' : '';

                    html += `
        <div class="prereq-item-row" style="${rowStyle}">
            <!-- IZQUIERDA: Checkbox principal + Nombre -->
            <div class="prereq-left">
                <input type="checkbox" 
                       class="prereq-checkbox" 
                       ${isDone ? 'checked' : ''} 
                       ${mainDisabled}
                       onchange="togglePrereqStatus('${project.id}', '${stdName}', 'done', this.checked)">
                
                <span class="prereq-label ${labelClass} ${savedItem.url ? 'has-link' : ''}"
                      style="cursor:pointer; text-decoration: underline dotted;"
                      onclick="handlePrereqClick(event, '${project.id}', '${stdName}')">
                    ${stdName}
                </span>
            </div>

            <!-- DERECHA: Opción N/A -->
            <div class="prereq-na-wrapper">
                <label for="na-${index}" style="cursor:pointer; margin-right:4px;">N/A</label>
                <input type="checkbox" 
                       id="na-${index}"
                       class="prereq-na-checkbox"
                       ${isNa ? 'checked' : ''}
                       onchange="togglePrereqStatus('${project.id}', '${stdName}', 'na', this.checked)">
            </div>
        </div>`;
                });

                html += `</div></div>`;

            }

            // --- Comentarios (FORMATO EXACTO DAILY) ---
            // Filtrar comentarios
            const projectComments = dailyComments
                .filter(c => c.projectId === currentProjectId)
                .sort((a, b) => {
                    // Usar createdAt que ya tiene fecha y hora completas
                    return new Date(b.createdAt) - new Date(a.createdAt); // Más reciente primero
                });

            html += `<div class="ficha-section">
        <div class="section-title">
            Comentarios de dailys (${projectComments.length})
            <button style="float:right; font-size:11px; padding:3px 8px; border-radius:999px; border:none; cursor:pointer; background:#f3ecff; color:#2a1b4a;" onclick="goToDailyFromFicha()">📅 Ver en Daily</button>
        </div>`;

            if (projectComments.length === 0) {
                html += `<div class="empty-state">Sin comentarios aún. Añade tu primer comentario desde la vista Daily.</div>`;
            } else {
                html += `<div class="comments-box">`;
                projectComments.forEach(comment => {
                    // Formatear fecha
                    const dateObj = new Date(comment.date + 'T00:00:00');
                    const dd = String(dateObj.getDate()).padStart(2, '0');
                    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const yy = String(dateObj.getFullYear()).slice(-2);
                    const formattedDate = `${dd}/${mm}/${yy}`;

                    const responsable = comment.responsible || 'ND';

                    // Obtener iniciales del Autor (quien escribió)
                    // Si no tienes el campo 'userName' guardado, usará 'U' por defecto.
                    const autorName = comment.userName || 'Usuario';
                    const iniciales = autorName.substring(0, 2).toUpperCase();

                    const isCompleted = comment.completed;
                    const completedClass = isCompleted ? 'completed' : '';
                    const completedBadge = isCompleted ? '<span class="completion-badge">COMPLETADO</span>' : '';

                    html += `
            <div class="comment-entry ${completedClass}">
                <div class="comment-header">
                    <div class="comment-checkbox-wrapper">
                         <input type="checkbox" class="comment-checkbox" 
                                ${isCompleted ? 'checked' : ''} 
                                onclick="toggleCommentCompletionFromFicha(event, '${comment.id}')">
                         
                         <!-- Círculo con INICIALES del Autor -->
                         <div style="
                            width: 22px; height: 22px; 
                            background: #e1d6f5; color: #5a3a8a; 
                            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                            font-size: 9px; font-weight: 700; margin-right: 6px; flex-shrink: 0;" 
                            title="Autor: ${autorName}">
                            ${iniciales}
                         </div>

                         <!-- Cabecera con FECHA y RESPONSABLE -->
                         <div style="flex:1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-weight:700; color:var(--color-primary); font-size: 11px;">${formattedDate}</span>
                            
                            <span style="font-size: 10px; color: var(--color-text-secondary); background: rgba(0,0,0,0.05); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05);">
                                Resp: <strong>${escapeHtml(responsable)}</strong>
                            </span>
                         </div>
                         
                         ${completedBadge}
                    </div>
                </div>
                <div class="comment-text" style="margin-top:6px; padding-left: 58px; font-size: 12px;">
                    ${escapeHtml(comment.text).replace(/\n/g, '<br>')}
                </div>
            </div>`;
                });
                html += `</div>`;
            }

            html += `</div></div>`;

            let rightSidebarHtml = `
    <div class="right-sidebar">
        ${renderCapacityWidget()}
        ${renderLastStatusWidget()}
    </div>
`;

document.getElementById('fichaView').innerHTML = html + rightSidebarHtml;


        }

function renderDashboard() {
    const container = document.getElementById('dashboardView');
    
    container.innerHTML = '';
    
    if (!projects || !projects.length) {
        container.innerHTML = `<div class="empty-state">No hay proyectos. Crea uno para ver el dashboard.</div>`;
        return;
    }

    // Valores únicos para filtros
    const fases = Array.from(new Set(projects.map(p => p.phase).filter(Boolean))).sort();
    const prioridades = Array.from(new Set(projects.map(p => p.priority).filter(Boolean))).sort();
    const impactos = Array.from(new Set(projects.map(p => p.impact).filter(Boolean))).sort();
    const estados = Array.from(new Set(projects.map(p => p.status).filter(Boolean))).sort();

    // Contar filtros activos
    const activeFiltersCount = [
        dashboardFilters.proyecto,
        (dashboardFilters.fases || []).length > 0,
        (dashboardFilters.prioridades || []).length > 0,
        (dashboardFilters.impactos || []).length > 0,
        (dashboardFilters.estados || []).length > 0,
        dashboardFilters.fechaInicioDesde,
        dashboardFilters.fechaInicioHasta,
        dashboardFilters.fechaFinDesde,
        dashboardFilters.fechaFinHasta
    ].filter(Boolean).length;

    // BARRA DE FILTROS MEJORADA
    let html = `
    <div class="dashboard-header">
        ${activeFiltersCount > 0 ? `
        <div class="active-filters-badge">
            ${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}
        </div>` : ''}
    </div>

    <div class="dashboard-filters-bar">
        <div class="filter-group">
            <label>🔍 Proyecto</label>
            <input 
                type="text" 
                id="dashFilterProyecto"
                class="filter-input-modern" 
                placeholder="Buscar..." 
                value="${dashboardFilters.proyecto || ''}"
            >
        </div>

                <div class="filter-group">
            <label>📋 Fase</label>
            <select 
                id="dashFilterFase" 
                class="filter-select-compact" 
                multiple 
                size="3"
            >
                ${fases.map(f => `<option value="${f}" ${(dashboardFilters.fases || []).includes(f) ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
        </div>

        <div class="filter-group">
            <label>⚡ Prioridad</label>
            <select 
                id="dashFilterPrioridad" 
                class="filter-select-compact" 
                multiple 
                size="3"
            >
                ${prioridades.map(p => `<option value="${p}" ${(dashboardFilters.prioridades || []).includes(p) ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
        </div>

        <div class="filter-group">
            <label>💥 Impacto</label>
            <select 
                id="dashFilterImpacto" 
                class="filter-select-compact" 
                multiple 
                size="3"
            >
                ${impactos.map(i => `<option value="${i}" ${(dashboardFilters.impactos || []).includes(i) ? 'selected' : ''}>${i}</option>`).join('')}
            </select>
        </div>

        <div class="filter-group">
            <label>🚦 Estado</label>
            <select 
                id="dashFilterEstado" 
                class="filter-select-compact" 
                multiple 
                size="3"
            >
                ${estados.map(e => `<option value="${e}" ${(dashboardFilters.estados || []).includes(e) ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
        </div>


        <div class="filter-group filter-group-wide">
            <label>📅 Rango Fecha Inicio</label>
            <div class="date-range">
                <input 
                    type="date" 
                    id="dashFilterFechaInicioDesde"
                    class="filter-input-modern date-input" 
                    value="${dashboardFilters.fechaInicioDesde || ''}"
                >
                <span class="date-separator">→</span>
                <input 
                    type="date" 
                    id="dashFilterFechaInicioHasta"
                    class="filter-input-modern date-input" 
                    value="${dashboardFilters.fechaInicioHasta || ''}"
                >
            </div>
        </div>

        <div class="filter-group filter-group-wide">
            <label>📅 Rango Fecha Fin</label>
            <div class="date-range">
                <input 
                    type="date" 
                    id="dashFilterFechaFinDesde"
                    class="filter-input-modern date-input" 
                    value="${dashboardFilters.fechaFinDesde || ''}"
                >
                <span class="date-separator">→</span>
                <input 
                    type="date" 
                    id="dashFilterFechaFinHasta"
                    class="filter-input-modern date-input" 
                    value="${dashboardFilters.fechaFinHasta || ''}"
                >
            </div>
        </div>

        <div class="filter-group filter-group-action">
            <label>&nbsp;</label>
            <button class="btn-clear-filters" onclick="clearDashboardFilters()">
                🗑️ Limpiar filtros
            </button>
        </div>
    </div>
    `;

    // Aplicar filtros
    const filteredProjects = projects.filter(p => {
        if (dashboardFilters.proyecto) {
            const txt = dashboardFilters.proyecto.toLowerCase();
            const name = (p.name || '').toLowerCase();
            if (!name.includes(txt)) return false;
        }

        if (dashboardFilters.fases && dashboardFilters.fases.length > 0) {
            if (!dashboardFilters.fases.includes(p.phase)) return false;
        }

        if (dashboardFilters.prioridades && dashboardFilters.prioridades.length > 0) {
    if (!dashboardFilters.prioridades.includes(p.priority)) return false;
}

        if (dashboardFilters.impactos && dashboardFilters.impactos.length > 0) {
            if (!dashboardFilters.impactos.includes(p.impact)) return false;
        }

        if (dashboardFilters.estados && dashboardFilters.estados.length > 0) {
            if (!dashboardFilters.estados.includes(p.status)) return false;
        }

        if (dashboardFilters.fechaInicioDesde) {
            if (!p.startDate || p.startDate < dashboardFilters.fechaInicioDesde) return false;
        }

        if (dashboardFilters.fechaInicioHasta) {
            if (!p.startDate || p.startDate > dashboardFilters.fechaInicioHasta) return false;
        }

        if (dashboardFilters.fechaFinDesde) {
            if (!p.endDate || p.endDate < dashboardFilters.fechaFinDesde) return false;
        }

        if (dashboardFilters.fechaFinHasta) {
            if (!p.endDate || p.endDate > dashboardFilters.fechaFinHasta) return false;
        }

        return true;
    });

    let totalVolume = 0;
    let totalFte = 0;

    // Tabla de proyectos
    html += `
    <div class="dashboard-content">
        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-label">Proyectos</div>
                <div class="stat-value">${filteredProjects.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Activos</div>
                <div class="stat-value">${filteredProjects.filter(p => p.phase !== 'Cerrado').length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Completados</div>
                <div class="stat-value">${filteredProjects.filter(p => p.phase === 'Cerrado').length}</div>
            </div>
        </div>

        <div class="dashboard-table-container">
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th onclick="toggleDashboardSort('name')" class="sortable-header">Proyecto ${getSortIndicator('name')}</th>
                        <th onclick="toggleDashboardSort('startDate')" class="sortable-header">Inicio ${getSortIndicator('startDate')}</th>
                        <th onclick="toggleDashboardSort('endDate')" class="sortable-header">Fin ${getSortIndicator('endDate')}</th>
                        <th onclick="toggleDashboardSort('phase')" class="sortable-header">Fase ${getSortIndicator('phase')}</th>
                        <th onclick="toggleDashboardSort('priority')" class="sortable-header">Prioridad ${getSortIndicator('priority')}</th>
                        <th onclick="toggleDashboardSort('impact')" class="sortable-header">Impacto ${getSortIndicator('impact')}</th>
                        <th onclick="toggleDashboardSort('status')" class="sortable-header">Estado ${getSortIndicator('status')}</th>
                        <th onclick="toggleDashboardSort('progress')" class="sortable-header">Avance ${getSortIndicator('progress')}</th>
                        <th onclick="toggleDashboardSort('volume')" class="sortable-header">Ahorro € ${getSortIndicator('volume')}</th>
                        <th onclick="toggleDashboardSort('fte')" class="sortable-header">Ahorro FTE ${getSortIndicator('fte')}</th>
                    </tr>
                </thead>
                <tbody>`;

    // Aplicar ordenamiento
    const sortedProjects = sortDashboardProjects(filteredProjects);

    sortedProjects.forEach(p => {
        const start = formatDateDisplay(p.startDate);
        const end = formatDateDisplay(p.endDate);
        const progress = isNaN(parseInt(p.progress, 10)) ? 0 : parseInt(p.progress, 10);
        const volume = Number(p.volume) || 0;
        const fte = Number(p.fte) || 0;
        
        totalVolume += volume;
        totalFte += fte;

        html += `
        <tr class="dashboard-row" onclick="selectProject('${p.id}')">
            <td class="dash-name">${escapeHtml(p.name || 'Sin nombre')}</td>
            <td>${start || '-'}</td>
            <td>${end || '-'}</td>
            <td><span class="badge badge-fase">${p.phase || '-'}</span></td>
            <td><span class="badge badge-${(p.priority || 'Media').toLowerCase()}">${p.priority || '-'}</span></td>
            <td><span class="badge badge-${(p.impact || 'Medio').toLowerCase()}">${p.impact || '-'}</span></td>
            <td><span class="badge badge-status badge-${(p.status || 'Verde').toLowerCase()}">${p.status || '-'}</span></td>
            <td>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    <span class="progress-bar-text">${progress}%</span>
                </div>
            </td>
            <td class="dash-num-center">${volume.toLocaleString('es-ES')}</td>
<td class="dash-num-center">${fte.toLocaleString('es-ES', { minimumFractionDigits: 1 })}</td>
        </tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div class="dashboard-summary">
            <div class="summary-title">Totales</div>
            <div class="summary-row">
                <div class="summary-item">
                    <div class="summary-label">Ahorro Total €</div>
                    <div class="summary-value">${totalVolume.toLocaleString('es-ES')} €</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Ahorro Total FTE</div>
                    <div class="summary-value">${totalFte.toLocaleString('es-ES', { minimumFractionDigits: 1 })}</div>
                </div>
            </div>
        </div>
    </div>`;

    // Widget de dedicación
    const week1Start = new Date(capacityWeekStart);
    const week2Start = new Date(capacityWeekStart);
    week2Start.setDate(week2Start.getDate() + 7);

    const week1Key = formatDateKey(week1Start);
    const week2Key = formatDateKey(week2Start);

    html += `
    <div class="dashboard-capacity-section">
        <div class="capacity-card">
            <h3 class="capacity-title">Dedicación Semanal del Equipo</h3>
            <p class="capacity-subtitle">Suma de dedicación en todos los proyectos activos</p>
            <table class="capacity-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th class="dash-num-center">Semana Actual</th>
                        <th class="dash-num-center">Próxima Semana</th>
                    </tr>
                </thead>
                <tbody>`;

    teamMembers.forEach(user => {
        const capsWeek1 = projectCapacities.filter(c =>
            c.userInitials === user && c.weekStart === week1Key
        );
        const capsWeek2 = projectCapacities.filter(c =>
            c.userInitials === user && c.weekStart === week2Key
        );

        const percent1 = capsWeek1.reduce((sum, c) => sum + (c.capacityPercent || 0), 0);
        const percent2 = capsWeek2.reduce((sum, c) => sum + (c.capacityPercent || 0), 0);

        const colorClass1 = percent1 > 100 ? 'overcapacity' : percent1 >= 80 ? 'high-capacity' : '';
        const colorClass2 = percent2 > 100 ? 'overcapacity' : percent2 >= 80 ? 'high-capacity' : '';

        html += `
                    <tr>
                        <td class="cap-user"><div class="user-avatar">${user}</div></td>
                        <td class="cap-percent dash-num-center ${colorClass1}">${percent1}%</td>
                        <td class="cap-percent dash-num-center ${colorClass2}">${percent2}%</td>
                    </tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
    </div>`;

    container.innerHTML = html;

    // Event listeners
    setTimeout(() => {
  // Filtro de texto - CON PRESERVACIÓN DE CURSOR
  const proyectoInput = document.getElementById('dashFilterProyecto');
  if (proyectoInput) {
    proyectoInput.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      dashboardFilters.proyecto = e.target.value;
      renderDashboard();
      
      // Restaurar cursor después del re-render
      setTimeout(() => {
        const newInput = document.getElementById('dashFilterProyecto');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    });
  }
  
  ['dashFilterFase', 'dashFilterPrioridad', 'dashFilterImpacto', 'dashFilterEstado'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.addEventListener('change', () => {
        const selected = Array.from(select.selectedOptions).map(opt => opt.value);
        const keyMap = {
          'dashFilterFase': 'fases',
          'dashFilterPrioridad': 'prioridades',
          'dashFilterImpacto': 'impactos',
          'dashFilterEstado': 'estados'
        };
        dashboardFilters[keyMap[id]] = selected;
        renderDashboard();
      });
    }
  });
  
  ['fechaInicioDesde', 'fechaInicioHasta', 'fechaFinDesde', 'fechaFinHasta'].forEach(key => {
    const input = document.getElementById(`dashFilter${key.charAt(0).toUpperCase() + key.slice(1)}`);
    if (input) {
      input.addEventListener('change', (e) => {
        dashboardFilters[key] = e.target.value;
        renderDashboard();
      });
    }
  });
}, 0);

}



function clearDashboardFilters() {
    dashboardFilters = {
        proyecto: '',
        fases: [],
        prioridades: [],
        impactos: [],
        estados: [],
        fechaInicioDesde: '',
        fechaInicioHasta: '',
        fechaFinDesde: '',
        fechaFinHasta: ''
    };
    renderDashboard();
}

function toggleDashboardSort(column) {
    if (dashboardSort.column === column) {
        // Si es la misma columna, invertir la dirección
        dashboardSort.direction = dashboardSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Si es una columna diferente, establecer orden ascendente
        dashboardSort.column = column;
        dashboardSort.direction = 'asc';
    }
    renderDashboard();
}

function getSortIndicator(column) {
    if (dashboardSort.column !== column) return '';
    return dashboardSort.direction === 'asc' ? '▲' : '▼';
}

function sortDashboardProjects(projects) {
    if (!dashboardSort.column) return projects;
    
    const sorted = [...projects].sort((a, b) => {
        let aVal, bVal;
        
        switch(dashboardSort.column) {
            case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
            case 'startDate':
                aVal = a.startDate || '';
                bVal = b.startDate || '';
                break;
            case 'endDate':
                aVal = a.endDate || '';
                bVal = b.endDate || '';
                break;
            case 'phase':
                aVal = (a.phase || '').toLowerCase();
                bVal = (b.phase || '').toLowerCase();
                break;
            case 'priority':
                const priorityOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
                aVal = priorityOrder[a.priority] || 0;
                bVal = priorityOrder[b.priority] || 0;
                break;
            case 'impact':
                const impactOrder = { 'Alto': 3, 'Medio': 2, 'Bajo': 1 };
                aVal = impactOrder[a.impact] || 0;
                bVal = impactOrder[b.impact] || 0;
                break;
            case 'status':
                const statusOrder = { 'Rojo': 3, 'Ámbar': 2, 'Verde': 1 };
                aVal = statusOrder[a.status] || 0;
                bVal = statusOrder[b.status] || 0;
                break;
            case 'progress':
                aVal = parseInt(a.progress, 10) || 0;
                bVal = parseInt(b.progress, 10) || 0;
                break;
            case 'volume':
                aVal = Number(a.volume) || 0;
                bVal = Number(b.volume) || 0;
                break;
            case 'fte':
                aVal = Number(a.fte) || 0;
                bVal = Number(b.fte) || 0;
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) {
            return dashboardSort.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
            return dashboardSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    return sorted;
}

function toggleDailySort(column) {
    if (dailySort.column === column) {
        // Si es la misma columna, invertir la dirección
        dailySort.direction = dailySort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Si es una columna diferente, establecer orden ascendente
        dailySort.column = column;
        dailySort.direction = 'asc';
    }
    renderDaily();
}

function getSortIndicatorDaily(column) {
    if (dailySort.column !== column) return '';
    return dailySort.direction === 'asc' ? '▲' : '▼';
}

function sortDailyProjects(projects) {
    if (!dailySort.column) return projects;
    
    const sorted = [...projects].sort((a, b) => {
        let aVal, bVal;
        
        switch(dailySort.column) {
            case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
            case 'status':
                const phaseOrder = { 'Idea': 1, 'En Progreso': 2, 'On Hold': 3, 'Cerrado': 4 };
                aVal = phaseOrder[a.phase] || 0;
                bVal = phaseOrder[b.phase] || 0;
                break;
            case 'startDate':
                aVal = a.startDate || '';
                bVal = b.startDate || '';
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) {
            return dailySort.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
            return dailySort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    return sorted;
}

        function goToDailyFromFicha() {
            if (!currentProjectId) return;
            switchView('daily');
        }

        function togglePrerequisite(projectId, index) {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                // 1. Actualizar en memoria
                project.prerequisites[index].completed = !project.prerequisites[index].completed;

                // 2. Re-renderizar la ficha para ver el cambio inmediatamente
                renderFicha();

                // 3. Guardar en Supabase
                updateProjectField(projectId, 'prerequisites', project.prerequisites);
            }
        }

        async function togglePrereqStatus(projectId, prereqName, type, isChecked) {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            // Aseguramos que existe el array
            if (!Array.isArray(project.prerequisites)) {
                project.prerequisites = [];
            }

            // Buscamos el índice de este prerrequisito en los datos del proyecto
            let itemIndex = project.prerequisites.findIndex(p => p.name === prereqName);

            // Si no existe (porque es un proyecto viejo o nuevo campo), lo añadimos
            if (itemIndex === -1) {
                project.prerequisites.push({
                    name: prereqName,
                    done: false,
                    na: false
                });
                itemIndex = project.prerequisites.length - 1;
            }

            // LÓGICA DE ACTUALIZACIÓN
            if (type === 'done') {
                // Si marcamos "Hecho", guardamos el valor
                project.prerequisites[itemIndex].done = isChecked;

                // (Opcional) Si marcas Hecho, podrías desmarcar N/A si quisieras:
                // if(isChecked) project.prerequisites[itemIndex].na = false;

            } else if (type === 'na') {
                // Si marcamos "N/A"
                project.prerequisites[itemIndex].na = isChecked;

                // Si activamos N/A, desactivamos "Hecho" automáticamente
                if (isChecked) {
                    project.prerequisites[itemIndex].done = false;
                }
            }

            // 1. Actualizamos la vista inmediatamente para que el usuario vea el cambio
            renderFicha();

            // 2. Guardamos en Supabase silenciosamente
            await updateProjectField(projectId, 'prerequisites', project.prerequisites);
        }

            // Maneja el clic sobre el nombre del prerrequisito: abrir modal para añadir/abrir/editar/borrar enlace
            function handlePrereqClick(event, projectId, prereqName) {
                event.stopPropagation();
                openPrereqModal(projectId, prereqName);
            }

            // --- Modal de Prerrequisito ---
            function ensurePrereqModal() {
                if (document.getElementById('prereqModal')) return;

                const modal = document.createElement('div');
                modal.id = 'prereqModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3 class="modal-title">Enlace Prerrequisito</h3>
                        <div class="form-group">
                            <label>Proyecto / Prerrequisito</label>
                            <div id="prereqModalLabel" style="font-weight:700; margin-bottom:6px;"></div>
                        </div>
                        <div class="form-group">
                            <label>URL</label>
                            <input type="text" id="prereqUrlInput" placeholder="https://..." />
                        </div>
                        <div class="modal-buttons prereq-modal-buttons">
                            <button class="btn btn-primary" id="prereqSaveBtn">Guardar</button>
                            <button class="btn" id="prereqOpenBtn">Abrir</button>
                            <button class="btn btn-cancel" id="prereqDeleteBtn">Borrar</button>
                            <button class="btn btn-cancel" id="prereqCancelBtn">Cancelar</button>
                        </div>
                    </div>`;

                document.body.appendChild(modal);

                // Listeners
                document.getElementById('prereqSaveBtn').addEventListener('click', savePrereqModal);
                document.getElementById('prereqOpenBtn').addEventListener('click', openPrereqFromModal);
                document.getElementById('prereqDeleteBtn').addEventListener('click', deletePrereqFromModal);
                document.getElementById('prereqCancelBtn').addEventListener('click', closePrereqModal);
                modal.addEventListener('click', (e) => { if (e.target === modal) closePrereqModal(); });
            }

            function openPrereqModal(projectId, prereqName) {
                ensurePrereqModal();
                const modal = document.getElementById('prereqModal');
                const label = document.getElementById('prereqModalLabel');
                const input = document.getElementById('prereqUrlInput');

                const project = projects.find(p => p.id === projectId);
                if (!project) return;

                if (!Array.isArray(project.prerequisites)) project.prerequisites = [];
                let itemIndex = project.prerequisites.findIndex(p => p.name === prereqName);
                if (itemIndex === -1) {
                    project.prerequisites.push({ name: prereqName, done: false, na: false });
                    itemIndex = project.prerequisites.length - 1;
                }

                const item = project.prerequisites[itemIndex];
                label.textContent = `${project.name} — ${prereqName}`;
                input.value = item.url || '';

                modal.dataset.projectId = projectId;
                modal.dataset.prereqName = prereqName;
                modal.classList.add('active');
                input.focus();
            }

            function closePrereqModal() {
                const modal = document.getElementById('prereqModal');
                if (!modal) return;
                modal.classList.remove('active');
                delete modal.dataset.projectId;
                delete modal.dataset.prereqName;
            }

            async function savePrereqModal() {
                const modal = document.getElementById('prereqModal');
                const projectId = modal.dataset.projectId;
                const prereqName = modal.dataset.prereqName;
                const input = document.getElementById('prereqUrlInput');
                const urlVal = (input.value || '').trim();

                const project = projects.find(p => p.id === projectId);
                if (!project) return closePrereqModal();

                let itemIndex = project.prerequisites.findIndex(p => p.name === prereqName);
                if (itemIndex === -1) return closePrereqModal();

                if (!urlVal) {
                    delete project.prerequisites[itemIndex].url;
                } else {
                    // simple validation
                    try { new URL(urlVal); } catch (e) { alert('URL inválida'); return; }
                    project.prerequisites[itemIndex].url = urlVal;
                }

                await updateProjectField(projectId, 'prerequisites', project.prerequisites);
                renderFicha();
                closePrereqModal();
            }

            function openPrereqFromModal() {
                const modal = document.getElementById('prereqModal');
                const projectId = modal.dataset.projectId;
                const prereqName = modal.dataset.prereqName;
                const project = projects.find(p => p.id === projectId);
                if (!project) return;
                const item = (project.prerequisites || []).find(p => p.name === prereqName);
                if (item && item.url) {
                    try { window.open(item.url, '_blank'); } catch (e) { console.error(e); }
                } else {
                    alert('No hay URL asignada. Usa Guardar para añadir una.');
                }
            }

            async function deletePrereqFromModal() {
                const modal = document.getElementById('prereqModal');
                const projectId = modal.dataset.projectId;
                const prereqName = modal.dataset.prereqName;
                const project = projects.find(p => p.id === projectId);
                if (!project) return;
                const itemIndex = project.prerequisites.findIndex(p => p.name === prereqName);
                if (itemIndex === -1) return;
                if (!confirm('Borrar enlace asociado a "' + prereqName + '"?')) return;
                delete project.prerequisites[itemIndex].url;
                await updateProjectField(projectId, 'prerequisites', project.prerequisites);
                renderFicha();
                closePrereqModal();
            }



        // =====================================================
        // =========== NAVEGACIÓN E INICIALIZACIÓN APP =========
        // (cambio de vistas, carga inicial, tiempo real, etc.)
        // =====================================================



        function switchView(view) {
            // 1. Ocultar todas las vistas
            document.getElementById('dailyView').classList.remove('active');
            document.getElementById('fichaView').classList.remove('active');
            document.getElementById('teamView').classList.remove('active');
            document.getElementById('dashboardView').classList.remove('active');

            // 2. Quitar clase active de botones
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            // 3. Mostrar la vista correspondiente y actualizar botón
            if (view === 'daily') {
                document.getElementById('dailyView').classList.add('active');
                document.querySelectorAll('.nav-btn')[1].classList.add('active');
                renderDaily();
            } else if (view === 'ficha') {
                document.getElementById('fichaView').classList.add('active');
                document.querySelectorAll('.nav-btn')[3].classList.add('active');
                renderFicha();
            } else if (view === 'team') {
                document.getElementById('teamView').classList.add('active');
                document.querySelectorAll('.nav-btn')[2].classList.add('active');
                renderTeamView();
            } else if (view === 'dashboard') {
                document.getElementById('dashboardView').classList.add('active');
                document.querySelectorAll('.nav-btn')[0].classList.add('active');
                renderDashboard();
            }
        }



        async function loadDataFromSupabase(skipRender = false) {
            await loadCapacities();
            await loadProjectStatuses();
            const { data: projData, error: projError } = await supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: true });

            if (projError) {
                console.error(projError);
                alert('Error cargando proyectos');
                return;
            }

            const { data: comData, error: comError } = await supabaseClient
                .from('daily_comments')
                .select('*')
                .order('created_at', { ascending: true });

            if (comError) {
                console.error(comError);
                alert('Error cargando comentarios');
                return;
            }

            projects = (projData || []).map(p => ({
                id: p.id,
                name: p.name || '(Sin nombre)',
                startDate: p.start_date || null,
                endDate: p.end_date || null,
                benefits: p.benefits || "",
                phase: p.phase || "Idea",
                stakeholders: p.stakeholders || "",
                volume: p.volume || "",
                prerequisites: p.prerequisites || [],
                priority: p.priority || "Media",
                impact: p.impact || "Medio",
                status: p.status || "Verde",
                progress: p.progress || 0,
                fte: p.fte,
                createdAt: p.created_at
            }));




            dailyComments = (comData || []).map(c => ({
                id: c.id,
                projectId: c.project_id,
                date: c.date,
                time: c.time,
                responsible: c.responsible,
                urgency: c.urgency || 'Normal',
                hasIncident: !!c.has_incident,
                text: c.text || '',
                completed: !!c.completed,
                userName: c.user_name || 'US',
                createdAt: c.created_at
            }));


            renderProjectsList();
            if (projects.length > 0 && !currentProjectId) {
                currentProjectId = projects[0].id;
            }
            updateWeekInfo();

            // Solo renderizar si no se especifica skipRender
            if (!skipRender) {
    renderDaily();
    renderFicha();  // ← AÑADE ESTA LÍNEA
}
        }



        let projectsChannel = supabaseClient.channel('projects-changes');
        let commentsChannel = supabaseClient.channel('comments-changes');

        projectsChannel
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                async (payload) => {
                    // console.log('Proyecto actualizado:', payload.new);
                    await loadDataFromSupabase();
                }
            )
            .subscribe();

        commentsChannel
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'daily_comments' },
                async (payload) => {
                    // console.log('Comentario nuevo/editado:', payload.new);
                    await loadDataFromSupabase();
                }
            )
            .subscribe();


        // =====================================================
        // =================== VISTA DE EQUIPO =================
        // (calendario, vacaciones, resúmenes de equipo, etc.)
        // =====================================================


        function renderTeamView() {
            const container = document.getElementById('teamView');

            // Header con navegación de mes
            const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

            let html = `
    <div class="team-header">
        <div class="month-navigation">
            <button class="month-nav-btn" onclick="previousMonth()">← Mes anterior</button>
            <div class="current-month">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</div>
            <button class="month-nav-btn" onclick="nextMonth()">Mes siguiente →</button>
        </div>
        <button class="month-nav-btn" onclick="openVacationModal()">➕ Añadir vacaciones</button>
    </div>
`;


            // Calendario
            html += renderMonthCalendar();

            // NUEVA SECCIÓN: Resumen de vacaciones
            html += renderVacationSummary();

            // Estadísticas (las del usuario actual, puedes quitarlas si quieres)
            // html += renderTeamStats(); // <-- Comenta o borra esta línea si no la quieres

            container.innerHTML = html;
        }


        function renderMonthCalendar() {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            // Generar calendario para varios meses consecutivos
            const numberOfMonths = 12; // <--- CAMBIA ESTE NÚMERO PARA MÁS O MENOS MESES
            const months = [];

            for (let i = 0; i < numberOfMonths; i++) {
                const targetMonth = month + i;
                const targetYear = year + Math.floor(targetMonth / 12);
                const adjustedMonth = targetMonth % 12;

                months.push({
                    year: targetYear,
                    month: adjustedMonth
                });
            }

            let html = `<div class="calendar-scroll-container"><table class="calendar-table">`;

            // ===== THEAD: HEADERS DE MESES =====
            html += `<thead><tr>`;
            html += `<th class="name-column">Miembro</th>`;

            months.forEach(m => {
                const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
                const monthName = new Date(m.year, m.month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                html += `<th class="month-header" colspan="${daysInMonth}">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</th>`;
            });
            html += `</tr>`;

            // ===== THEAD: HEADERS DE DÍAS =====
            html += `<tr><th class="name-column"></th>`;

            months.forEach((m, monthIndex) => {
                const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(m.year, m.month, day);
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
                    const weekendClass = isWeekend ? ' weekend-header' : '';
                    const separatorClass = (day === 1 && monthIndex > 0) ? ' month-separator' : '';
                    html += `<th class="${weekendClass}${separatorClass}" title="${date.toLocaleDateString('es-ES')}">${dayName}<br>${day}</th>`;
                }
            });
            html += `</tr></thead>`;

            // ===== TBODY: FILAS DE MIEMBROS =====
            html += `<tbody>`;

            teamMembers.forEach(member => {
                html += `<tr>`;
                html += `<td class="name-column">${member}</td>`;

                months.forEach((m, monthIndex) => {
                    const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();

                    for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(m.year, m.month, day);
                        const dateKey = formatDateKey(date);
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isHoliday = madridHolidays.includes(dateKey);

                        // Check if user has vacation this day
                        const vacation = teamVacations.find(v =>
                            v.user_initials === member &&
                            dateKey >= v.start_date &&
                            dateKey <= v.end_date
                        );

                        let cellClass = '';
                        let cellContent = '';

                        if (isWeekend) cellClass += ' weekend';
                        if (isHoliday) cellClass += ' holiday';
                        if (day === 1 && monthIndex > 0) cellClass += ' month-separator';

                        // Verificar si este día está seleccionado
                        const isSelected = selectedVacationDays.some(
                            d => d.member === member && d.dateKey === dateKey
                        );
                        if (isSelected) cellClass += ' vacation-selected';

                        if (vacation) {
                            if (vacation.vacation_type === 'current_year') {
                                cellClass += ' vacation-current-year';
                            } else if (vacation.vacation_type === 'previous_year') {
                                cellClass += ' vacation-previous-year';
                            } else if (vacation.vacation_type === 'willis_choice') {
                                cellClass += ' vacation-willis-choice';
                            }
                            cellContent = Number(vacation.days_count) % 1 === 0 ? Number(vacation.days_count) : Number(vacation.days_count).toFixed(1);
                        }

                        html += `<td class="${cellClass}" onclick="toggleVacation('${member}', '${dateKey}', event)" title="${member} - ${dateKey}">${cellContent}</td>`;
                    }
                });

                html += `</tr>`;
            });

            html += `</tbody></table></div>`;

            // AQUÍ ES DONDE ESTABA LA LEYENDA, YA BORRADA.

            return html;
        }


        function renderTeamStats() {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const currentYear = new Date().getFullYear();

            // Obtener usuario actual, fallback a 'NN' si no está definido
            const userToFilter = typeof currentUser !== 'undefined' ? currentUser : 'NN';

            // Vacaciones este mes (solo del usuario actual)
            const myVacationsThisMonth = teamVacations
                .filter(v =>
                    v.user_initials === userToFilter &&
                    v.start_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
                )
                .reduce((sum, v) => sum + (Number(v.days_count) || 0), 0);

            // Total vacaciones año actual
            const myVacationsCurrentYear = teamVacations
                .filter(v =>
                    v.user_initials === userToFilter &&
                    (v.vacation_year === currentYear || (!v.vacation_year && new Date(v.start_date).getFullYear() === currentYear)) &&
                    v.vacation_type === 'current_year'
                )
                .reduce((sum, v) => sum + (Number(v.days_count) || 0), 0);

            // Total Willis Choice
            const myWillisChoice = teamVacations
                .filter(v =>
                    v.user_initials === userToFilter &&
                    v.vacation_type === 'willis_choice'
                )
                .reduce((sum, v) => sum + (Number(v.days_count) || 0), 0);

            return `
        <div class="team-stats">
            <div class="stat-card">
                <div class="stat-label">Vacaciones este mes (${userToFilter})</div>
                <div class="stat-value">${myVacationsThisMonth.toFixed(1)} días</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total vacaciones ${currentYear}</div>
                <div class="stat-value">${myVacationsCurrentYear.toFixed(1)} días</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Willis Choice</div>
                <div class="stat-value">${myWillisChoice.toFixed(1)} días</div>
            </div>
        </div>
    `;
        }

        function renderVacationSummary() {
            const currentYear = new Date().getFullYear();

            // Calcular totales por usuario
            const summary = teamMembers.map(member => {
                // Vacaciones año actual
                const currentYearDays = teamVacations
                    .filter(v =>
                        v.user_initials === member &&
                        v.vacation_type === 'current_year' &&
                        (v.vacation_year === currentYear || new Date(v.start_date).getFullYear() === currentYear)
                    )
                    .reduce((sum, v) => sum + (Number(v.days_count) || 0), 0);

                // Willis Choice año actual
                const willisChoiceDays = teamVacations
                    .filter(v =>
                        v.user_initials === member &&
                        v.vacation_type === 'willis_choice' &&
                        new Date(v.start_date).getFullYear() === currentYear
                    )
                    .reduce((sum, v) => sum + (Number(v.days_count) || 0), 0);

                return {
                    member,
                    currentYearDays,
                    willisChoiceDays,
                    total: currentYearDays + willisChoiceDays
                };
            });

            return `
        <div class="vacation-summary">
            <h3 class="summary-title">Resumen de Vacaciones ${currentYear}</h3>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Año Actual</th>
                        <th>Willis Choice</th>
                        <th class="total-column">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${summary.map(s => `
                        <tr>
                            <td class="member-name">${s.member}</td>
                            <td class="vacation-current">${s.currentYearDays.toFixed(1)}</td>
                            <td class="vacation-willis">${s.willisChoiceDays.toFixed(1)}</td>
                            <td class="total-column"><strong>${s.total.toFixed(1)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
        }

        function previousMonth() {
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            renderTeamView();
        }

        function nextMonth() {
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            renderTeamView();
        }

        function toggleVacation(member, dateKey, event) {
            if (member !== currentUser) {
                alert('Solo puedes marcar tus propias vacaciones');
                return;
            }

            // Si es Ctrl+Clic, agregar a la selección múltiple
            if (event && event.ctrlKey) {
                event.preventDefault();
                const index = selectedVacationDays.findIndex(
                    d => d.member === member && d.dateKey === dateKey
                );

                if (index > -1) {
                    // Ya está seleccionado, remover
                    selectedVacationDays.splice(index, 1);
                } else {
                    // Agregar a la selección
                    selectedVacationDays.push({ member, dateKey });
                }

                renderTeamView();
                return;
            }

            // Clic normal: verificar si ya existe vacación en este día
            const existing = teamVacations.find(v =>
                v.user_initials === member &&
                v.start_date <= dateKey &&
                v.end_date >= dateKey
            );

            // Si existe vacación, permitir eliminarla siempre
            if (existing) {
                const confirmDelete = confirm(`¿Eliminar ${existing.days_count} día(s) de vacaciones?`);
                if (confirmDelete) {
                    deleteVacation(existing.id);
                }
                return;
            }

            // Si NO es Ctrl+Clic y hay selecciones previas sin vacaciones, mostrar alerta
            if (selectedVacationDays.length > 0) {
                alert('Ya tienes días seleccionados. Usa el botón "Añadir vacaciones" para confirmar o haz Ctrl+Clic en los días para deseleccionarlos.');
                return;
            }

            // Comportamiento normal: clic simple sin selecciones previas y sin vacaciones existentes
            showVacationOptionsModal(member, dateKey, [dateKey]);
        }

        function showVacationOptionsModal(member, startDateKey, dateKeysArray = []) {
            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;

            const yearChoice = prompt(
                `¿A qué año corresponden estas vacaciones?\n\n` +
                `1 - Año actual (${currentYear})\n` +
                `2 - Año anterior (${previousYear})\n` +
                `3 - Willis Choice\n\n` +
                `Introduce 1, 2 o 3:`
            );

            if (!yearChoice || !['1', '2', '3'].includes(yearChoice)) {
                return;
            }

            const daysInput = prompt('¿Cuántos días quieres computar? (ej: 1, 0.5, etc.)', '1');

            if (!daysInput) {
                return;
            }

            const days = parseFloat(daysInput);
            if (isNaN(days) || days <= 0) {
                alert('Número de días inválido');
                return;
            }

            let vacationType;
            let vacationYear;

            if (yearChoice === '1') {
                vacationType = 'current_year';
                vacationYear = currentYear;
            } else if (yearChoice === '2') {
                vacationType = 'previous_year';
                vacationYear = previousYear;
            } else {
                vacationType = 'willis_choice';
                vacationYear = currentYear;
            }

            // Si no hay fechas específicas, usar la del parámetro
            const datesToAdd = dateKeysArray.length > 0 ? dateKeysArray : [startDateKey];

            addVacationWithDateRange(member, datesToAdd, vacationType, vacationYear, days);
        }

        async function addVacationWithDateRange(member, dateKeysArray, vacationType, vacationYear, days) {
            if (!dateKeysArray || dateKeysArray.length === 0) return;

            // Crear un registro independiente por cada día
            // Esto permite borrar días individuales sin afectar a los demás
            const vacationRecords = dateKeysArray.map(dateKey => ({
                user_initials: member,
                start_date: dateKey,
                end_date: dateKey,
                status: 'planned',
                vacation_type: vacationType,
                vacation_year: vacationYear,
                days_count: days
            }));

            const { error } = await supabaseClient
                .from('team_vacations')
                .insert(vacationRecords);

            if (error) {
                console.error(error);
                alert('Error añadiendo vacación');
                return;
            }

            selectedVacationDays = [];
            await loadTeamVacations();
            renderTeamView();
        }

        async function addVacationWithDetails(member, dateKey, vacationType, vacationYear, days) {
            const { error } = await supabaseClient
                .from('team_vacations')
                .insert({
                    user_initials: member,
                    start_date: dateKey,
                    end_date: dateKey,
                    status: 'planned',
                    vacation_type: vacationType,
                    vacation_year: vacationYear,
                    days_count: days
                });

            if (error) {
                console.error(error);
                alert('Error añadiendo vacación');
                return;
            }

            await loadTeamVacations();
            renderTeamView();
        }


        async function deleteVacation(vacationId) {
            const { error } = await supabaseClient
                .from('team_vacations')
                .delete()
                .eq('id', vacationId);

            if (error) {
                console.error(error);
                alert('Error eliminando vacación');
                return;
            }

            await loadTeamVacations();
            renderTeamView();
        }

        async function loadTeamVacations() {
            const { data, error } = await supabaseClient
                .from('team_vacations')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) {
                console.error(error);
                return;
            }

            teamVacations = data;
        }

        function openVacationModal() {
            if (selectedVacationDays.length === 0) {
                alert('Por favor, selecciona días usando Ctrl+Clic en el calendario');
                return;
            }

            // Agrupar por miembro (debería haber solo uno, pero lo hacemos robusto)
            const members = [...new Set(selectedVacationDays.map(d => d.member))];

            if (members.length > 1) {
                alert('Has seleccionado días de diferentes miembros del equipo. Por favor, selecciona solo tus días.');
                return;
            }

            const member = members[0];
            const dateKeys = selectedVacationDays.map(d => d.dateKey);

            showVacationOptionsModal(member, null, dateKeys);
        }


        function changeUser() {
            const newUser = prompt('Introduce tus iniciales (ej: IS, DH, HR...)', currentUser);
            if (newUser && newUser.trim()) {
                currentUser = newUser.trim().toUpperCase();
                localStorage.setItem('wtw_current_user', currentUser);
                updateUserDisplay();
            }
        }

        function updateUserDisplay() {
            const userNameEl = document.querySelector('.user-name');
            const userIconEl = document.querySelector('.user-icon');
            if (!userNameEl || !userIconEl) return;

            // Texto fijo debajo: "Usuario"
            userNameEl.textContent = 'Usuario';

            // Iniciales solo en el círculo
            const initials = currentUser.substring(0, 2).toUpperCase();
            userIconEl.textContent = initials;
        }




        async function init() {
            // 1. CARGAR USUARIO DESDE LOCALSTORAGE
            const savedUser = localStorage.getItem('wtw_current_user');

            if (savedUser) {
                // Si existe usuario guardado, usarlo
                currentUser = savedUser;
            } else {
                // Si es la primera vez, solicitar iniciales
                const newUser = prompt('👋 Bienvenido/a al gestor WTW\\n\\nIntroduce tus iniciales (ej: IS, DH, HR...)');

                if (newUser && newUser.trim()) {
                    currentUser = newUser.trim().toUpperCase();
                    localStorage.setItem('wtw_current_user', currentUser);
                } else {
                    // Si cancela, usar valor por defecto
                    currentUser = 'US';
                    localStorage.setItem('wtw_current_user', currentUser);
                }
            }

            // 2. ACTUALIZAR INTERFAZ CON EL USUARIO CARGADO
            updateUserDisplay();

            // 3. CONFIGURAR HEADERS DE SECCIONES COLAPSABLES
            setTimeout(() => {
                setupSidebarHeaders();
            }, 100);

            // 4. CARGAR DATOS
            await loadDataFromSupabase();
            await loadTeamVacations();
        }

        function setupSidebarHeaders() {
            const activosTitle = document.querySelector('.sidebar-title:nth-of-type(1)');
            const completadosTitle = document.querySelector('.sidebar-title:nth-of-type(2)');

            if (activosTitle) {
                activosTitle.style.cursor = 'pointer';
                activosTitle.style.transition = 'all 140ms ease';
                activosTitle.onclick = () => toggleSidebarSection('activos');
                const icon = document.createElement('span');
                icon.className = 'section-toggle-icon';
                icon.style.marginRight = '8px';
                icon.style.display = 'inline-block';
                icon.setAttribute('data-collapsed', sidebarCollapsed.activos ? 'true' : 'false');
                activosTitle.insertBefore(icon, activosTitle.firstChild);
            }

            if (completadosTitle) {
                completadosTitle.style.cursor = 'pointer';
                completadosTitle.style.transition = 'all 140ms ease';
                completadosTitle.onclick = () => toggleSidebarSection('completados');
                const icon = document.createElement('span');
                icon.className = 'section-toggle-icon';
                icon.style.marginRight = '8px';
                icon.style.display = 'inline-block';
                icon.setAttribute('data-collapsed', sidebarCollapsed.completados ? 'true' : 'false');
                completadosTitle.insertBefore(icon, completadosTitle.firstChild);
            }
        }

        window.addEventListener('load', init);
