let intervalo;
let chart;
let tipoAceleracionSeleccionada = "constante";
let aceleracionActual = 2;
let enSimulacion = false;
let tiempoActual = 0;
let velocidadActual = 0;
let posicionActual = 0;
let valorAceleracionVariable = 0;
let distanciaTotal = 0;

// Datos para el gráfico
let datosTiempo = [];
let datosVelocidad = [];
let datosPosicion = [];
let datosAceleracion = [];

let velocidadMaxima = 0;
let aceleracionMaxima = 0;
let sumaVelocidades = 0;
let sumaAceleraciones = 0;
let contadorMuestras = 0;

// Variables globales para las ecuaciones
let velocidadInicialGlobal = 0; // Se inicializará en iniciarSimulacion
let posicionInicialGlobal = 0; // Se mantendrá en 0 para este caso

function cambiarTipoAceleracion() {
    const tipoSeleccionado = document.getElementById("tipo-aceleracion").value;
    document.getElementById("aceleracion-constante").style.display = tipoSeleccionado === "constante" ? "block" : "none";
    document.getElementById("aceleracion-variable").style.display = tipoSeleccionado === "variable" ? "block" : "none";
    tipoAceleracionSeleccionada = tipoSeleccionado;
}

function calcularAceleracion(tiempo) {
    if (tipoAceleracionSeleccionada === "constante") {
        return parseFloat(document.getElementById("aceleracion").value);
    } else {
        try {
            const expresion = document.getElementById("funcion-aceleracion").value;
            const scope = { t: tiempo };
            return math.evaluate(expresion, scope);
        } catch (error) {
            console.error("Error en la función de aceleración:", error);
            alert("Error en la función de aceleración. Usando valor predeterminado de 2 m/s².");
            return 2;
        }
    }
}

function iniciarSimulacion() {
    if (enSimulacion) return;

    reiniciarSimulacion();
    enSimulacion = true;

    // Habilitar controles en tiempo real
    document.getElementById("controles-tiempo-real").style.display = "block";
    document.getElementById("btn-iniciar").disabled = true;

    // Obtener los valores de entrada
    distanciaTotal = parseFloat(document.getElementById("distancia").value);
    velocidadInicialGlobal = parseFloat(document.getElementById("velocidad").value); // Asignar a variable global

    const auto = document.getElementById("auto");
    const anchoPista = document.querySelector(".contenedor-animacion").offsetWidth - auto.offsetWidth;

    // Establecer valores iniciales
    tiempoActual = 0;
    posicionActual = posicionInicialGlobal; // Usar posición inicial global (0)
    velocidadActual = velocidadInicialGlobal; // Usar velocidad inicial global
    aceleracionActual = calcularAceleracion(0);

    // Variables para gráficas
    datosTiempo = [];
    datosVelocidad = [];
    datosPosicion = [];
    datosAceleracion = [];

    // Inicializar variables estadísticas
    velocidadMaxima = velocidadInicialGlobal;
    aceleracionMaxima = 0;
    sumaVelocidades = 0;
    sumaAceleraciones = 0;
    contadorMuestras = 0;

    // Ocultar estadísticas hasta que termine la simulación
    document.getElementById("estadisticas").style.display = "none";

    // Mostrar tipo de movimiento inicial
    actualizarTipoMovimiento();

    // Iniciar el intervalo de simulación
    intervalo = setInterval(() => {
        if (posicionActual >= distanciaTotal) {
            finalizarSimulacion();
            return;
        }

        // Calcular aceleración para el tiempo actual
        aceleracionActual = calcularAceleracion(tiempoActual);

        // Actualizar posición y velocidad usando ecuaciones de movimiento
        const deltaT = 0.1; // incremento de tiempo en segundos

        // Ecuaciones de movimiento con aceleración variable (método de Euler)
        velocidadActual += aceleracionActual * deltaT;
        posicionActual += velocidadActual * deltaT;

        // Actualizar posición del auto en la animación
        const porcentajePosicion = (posicionActual / distanciaTotal) * anchoPista;
        auto.style.left = `${Math.min(porcentajePosicion, anchoPista)}px`;

        // Actualizar estadísticas
        sumaVelocidades += velocidadActual;
        sumaAceleraciones += aceleracionActual;
        contadorMuestras++;

        velocidadMaxima = Math.max(velocidadMaxima, velocidadActual);
        aceleracionMaxima = Math.max(aceleracionMaxima, Math.abs(aceleracionActual));

        // Actualizar valores dinámicos
        document.getElementById("tiempo").innerText = tiempoActual.toFixed(1);
        document.getElementById("posicion").innerText = posicionActual.toFixed(2);
        document.getElementById("velocidadActual").innerText = velocidadActual.toFixed(2);
        document.getElementById("aceleracionActual").innerText = aceleracionActual.toFixed(2);

        // Actualizar tipo de movimiento
        actualizarTipoMovimiento();

        // Guardar datos para gráficas
        datosTiempo.push(tiempoActual);
        datosVelocidad.push(velocidadActual);
        datosPosicion.push(posicionActual);
        datosAceleracion.push(aceleracionActual);

        // Actualizar gráfica en tiempo real
        actualizarGrafica();

        // Incrementar tiempo
        tiempoActual += deltaT;
    }, 100);
}

function finalizarSimulacion() {
    clearInterval(intervalo);
    enSimulacion = false;
    document.getElementById("btn-iniciar").disabled = false;

    // Ocultar valores dinámicos y controles en tiempo real
    document.getElementById("valores-dinamicos").style.display = "none";
    document.getElementById("controles-tiempo-real").style.display = "none";

    // Generar gráfica final
    generarGraficaFinal();
    
    // Calcular y mostrar estadísticas
    calcularYMostrarEstadisticas();
    
    // Mostrar ecuaciones utilizadas
    mostrarEcuaciones();

    // Mostrar botón de cálculo de integrales
    document.getElementById("controles-integrales").style.display = "block";
}

function cambiarAceleracionTiempoReal(cambio) {
    if (!enSimulacion) return;

    if (tipoAceleracionSeleccionada === "constante") {
        aceleracionActual += cambio;
        document.getElementById("aceleracion").value = aceleracionActual;
        document.getElementById("aceleracion-actual").innerText = `Aceleración: ${aceleracionActual.toFixed(1)} m/s²`;
    } else {
        // Para aceleración variable, modificamos el factor multiplicador
        try {
            let expresion = document.getElementById("funcion-aceleracion").value;
            let factorActual = 1;

            // Intenta extraer un factor multiplicador si existe
            const regex = /^(\d+(\.\d+)?)\*(.+)/;
            const match = expresion.match(regex);

            if (match) {
                factorActual = parseFloat(match[1]);
                const nuevaExpresion = (factorActual + cambio) + "*" + match[3];
                document.getElementById("funcion-aceleracion").value = nuevaExpresion;
            } else {
                // Si no hay factor explícito, agregamos uno
                document.getElementById("funcion-aceleracion").value = (1 + cambio) + "*(" + expresion + ")";
            }

            // Actualizar etiqueta
            document.getElementById("aceleracion-actual").innerText = `Aceleración modificada`;
        } catch (error) {
            console.error("Error al modificar la aceleración variable:", error);
        }
    }
    
    // Actualizar el tipo de movimiento después de cambiar la aceleración
    actualizarTipoMovimiento();
}

function actualizarTipoMovimiento() {
    let tipoMovimiento = "";

    if (Math.abs(aceleracionActual) < 0.01) {
        tipoMovimiento = "Movimiento Rectilíneo Uniforme (MRU)";
    } else if (tipoAceleracionSeleccionada === "constante" || Math.abs(calcularAceleracion(tiempoActual) - calcularAceleracion(tiempoActual - 0.1)) < 0.01) {
        tipoMovimiento = "Movimiento Rectilíneo Uniformemente Acelerado (MRUA)";
    } else {
        tipoMovimiento = "Movimiento con Aceleración Variable";
    }

    document.getElementById("tipoMovimiento").innerText = tipoMovimiento;
}

function actualizarGrafica() {
    if (!chart) {
        const ctx = document.getElementById("graficoMov").getContext("2d");
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: datosTiempo,
                datasets: [
                    {
                        label: "Velocidad (m/s)",
                        data: datosVelocidad,
                        borderColor: "blue",
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: "Posición (m)",
                        data: datosPosicion,
                        borderColor: "green",
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: "Aceleración (m/s²)",
                        data: datosAceleracion,
                        borderColor: "red",
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                animation: false,
                scales: {
                    x: {
                        title: { display: true, text: "Tiempo (s)" },
                        ticks: { maxTicksLimit: 10 }
                    },
                    y: {
                        title: { display: true, text: "Valor" },
                        ticks: { beginAtZero: true }
                    }
                }
            }
        });
    } else {
        chart.data.labels = datosTiempo;
        chart.data.datasets[0].data = datosVelocidad;
        chart.data.datasets[1].data = datosPosicion;
        chart.data.datasets[2].data = datosAceleracion;
        chart.update();
    }
}

function generarGraficaFinal() {
    if (chart) chart.destroy();

    const ctx = document.getElementById("graficoMov").getContext("2d");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: datosTiempo,
            datasets: [
                {
                    label: "Velocidad (m/s)",
                    data: datosVelocidad,
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: "Posición (m)",
                    data: datosPosicion,
                    borderColor: "green",
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: "Aceleración (m/s²)",
                    data: datosAceleracion,
                    borderColor: "red",
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Tiempo (s)" } },
                y: { title: { display: true, text: "Valor" } }
            }
        }
    });
}

function toggleDataset(index) {
    if (!chart) return;

    const dataset = chart.data.datasets[index];
    dataset.hidden = !dataset.hidden;
    chart.update();

    // Actualizar estilo del botón
    const botones = document.querySelectorAll('.toggle-buttons button');
    if (dataset.hidden) {
        botones[index].classList.add('inactive');
    } else {
        botones[index].classList.remove('inactive');
    }
}

function calcularIntegrales() {
    if (datosTiempo.length === 0) {
        alert("No hay datos de simulación disponibles.");
        return;
    }

    const tipoFuncion = document.getElementById("tipo-funcion-integral").value;
    const resultados = document.getElementById("resultados-integrales");
    
    let integralResultado = 0;
    let unidades = "";
    let descripcionFisica = "";
    let datos = [];

    switch (tipoFuncion) {
        case "velocidad":
            integralResultado = calcularIntegralTrapecio(datosTiempo, datosVelocidad);
            unidades = "m";
            descripcionFisica = "Desplazamiento total";
            datos = datosVelocidad;
            break;
        case "posicion":
            integralResultado = calcularIntegralTrapecio(datosTiempo, datosPosicion);
            unidades = "m·s";
            descripcionFisica = "Área bajo la curva de posición";
            datos = datosPosicion;
            break;
        case "aceleracion":
            integralResultado = calcularIntegralTrapecio(datosTiempo, datosAceleracion);
            unidades = "m/s";
            descripcionFisica = "Cambio total de velocidad";
            datos = datosAceleracion;
            break;
    }

    // Mostrar resultados
    resultados.innerHTML = `
        <h4>Resultado del Cálculo de Integral</h4>
        <div class="resultado-integral">
            <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Regla del Trapecio</p>
            <p><strong>Intervalo:</strong> [0, ${datosTiempo[datosTiempo.length - 1].toFixed(2)}] segundos</p>
            <p><strong>Valor de la integral:</strong> ${integralResultado.toFixed(4)} ${unidades}</p>
            <p><strong>Interpretación física:</strong> ${descripcionFisica}</p>
            <p><strong>Número de intervalos:</strong> ${datosTiempo.length - 1}</p>
        </div>
        
        <div class="detalles-calculo">
            <h5>Detalles del Cálculo</h5>
            <p>La integral se calculó usando la regla del trapecio con la fórmula:</p>
            <p class="formula">∫f(t)dt ≈ Σ[(f(t₍ᵢ₎) + f(t₍ᵢ₊₁₎))/2] × Δt</p>
            <p>Donde Δt = ${(datosTiempo[1] - datosTiempo[0]).toFixed(1)} segundos</p>
        </div>
    `;

    // Mostrar la sección de resultados
    document.getElementById("seccion-integrales").style.display = "block";
}

function calcularIntegralTrapecio(tiempos, valores) {
    if (tiempos.length !== valores.length || tiempos.length < 2) {
        return 0;
    }

    let integral = 0;
    
    for (let i = 0; i < tiempos.length - 1; i++) {
        const deltaT = tiempos[i + 1] - tiempos[i];
        const promedioValores = (valores[i] + valores[i + 1]) / 2;
        integral += promedioValores * deltaT;
    }

    return integral;
}

function calcularIntegralAnaliticamente() {
    const tipoFuncion = document.getElementById("tipo-funcion-integral").value;
    const resultados = document.getElementById("resultados-integrales");
    
    if (tipoAceleracionSeleccionada === "constante") {
        calcularIntegralAnaliticaConstante(tipoFuncion, resultados);
    } else {
        calcularIntegralAnaliticaVariable(tipoFuncion, resultados);
    }
}

function calcularIntegralAnaliticaConstante(tipoFuncion, elementoResultados) {
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
    const aceleracion = parseFloat(document.getElementById("aceleracion").value);
    const tiempoFinal = datosTiempo[datosTiempo.length - 1];
    
    let integral = 0;
    let formula = "";
    let unidades = "";
    let descripcion = "";

    switch (tipoFuncion) {
        case "velocidad":
            // v(t) = v₀ + at
            // ∫v(t)dt = v₀t + (1/2)at²
            integral = velocidadInicial * tiempoFinal + 0.5 * aceleracion * Math.pow(tiempoFinal, 2);
            formula = `∫(${velocidadInicial} + ${aceleracion}t)dt = ${velocidadInicial}t + (1/2)×${aceleracion}×t²`;
            unidades = "m";
            descripcion = "Desplazamiento total";
            break;
        case "aceleracion":
            // a(t) = a (constante)
            // ∫a dt = at
            integral = aceleracion * tiempoFinal;
            formula = `∫${aceleracion} dt = ${aceleracion}×t`;
            unidades = "m/s";
            descripcion = "Cambio total de velocidad";
            break;
        case "posicion":
            // x(t) = x₀ + v₀t + (1/2)at²
            // ∫x(t)dt = x₀t + (1/2)v₀t² + (1/6)at³
            integral = 0.5 * velocidadInicial * Math.pow(tiempoFinal, 2) + (1/6) * aceleracion * Math.pow(tiempoFinal, 3);
            formula = `∫(${posicionInicialGlobal} + ${velocidadInicial}t + (1/2)×${aceleracion}×t²)dt = ${posicionInicialGlobal}t + (1/2)×${velocidadInicial}×t² + (1/6)×${aceleracion}×t³`;
            unidades = "m·s";
            descripcion = "Área bajo la curva de posición";
            break;
    }

    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Integral</h4>
        <div class="resultado-integral">
            <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Integración Analítica</p>
            <p><strong>Fórmula:</strong> ${formula}</p>
            <p><strong>Evaluada en [0, ${tiempoFinal.toFixed(2)}]:</strong> ${integral.toFixed(4)} ${unidades}</p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
        </div>
    `;

    document.getElementById("seccion-integrales").style.display = "block";
}

function calcularIntegralAnaliticaVariable(tipoFuncion, elementoResultados) {
    const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
    const tiempoFinal = datosTiempo[datosTiempo.length - 1];
    
    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Integral</h4>
        <div class="resultado-integral">
            <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Integración Analítica (Aceleración Variable)</p>
            <p><strong>Función de aceleración:</strong> a(t) = ${funcionAceleracion}</p>
            <p><strong>Nota:</strong> Para aceleración variable, la integración analítica depende de la función específica.</p>
            <p><strong>Sugerencia:</strong> Use el método numérico (Regla del Trapecio) para obtener un resultado aproximado.</p>
        </div>
    `;
    
    document.getElementById("seccion-integrales").style.display = "block";
}

// NUEVAS FUNCIONES PARA CÁLCULO DE DERIVADAS

function calcularDerivadas() {
    if (datosTiempo.length === 0) {
        alert("No hay datos de simulación disponibles.");
        return;
    }

    const tipoFuncion = document.getElementById("tipo-funcion-derivada").value;
    const resultados = document.getElementById("resultados-derivadas");
    
    let derivadaResultado = [];
    let unidades = "";
    let descripcionFisica = "";
    let datos = [];

    switch (tipoFuncion) {
        case "posicion":
            derivadaResultado = calcularDerivadaNumerica(datosTiempo, datosPosicion);
            unidades = "m/s";
            descripcionFisica = "Velocidad instantánea";
            datos = datosPosicion;
            break;
        case "velocidad":
            derivadaResultado = calcularDerivadaNumerica(datosTiempo, datosVelocidad);
            unidades = "m/s²";
            descripcionFisica = "Aceleración instantánea";
            datos = datosVelocidad;
            break;
        case "aceleracion":
            derivadaResultado = calcularDerivadaNumerica(datosTiempo, datosAceleracion);
            unidades = "m/s³";
            descripcionFisica = "Jerk (cambio de aceleración)";
            datos = datosAceleracion;
            break;
    }

    // Verificar que hay datos para calcular estadísticas
    if (derivadaResultado.length === 0) {
        alert("No se pudieron calcular las derivadas.");
        return;
    }

    // Calcular estadísticas de la derivada
    const derivadaPromedio = derivadaResultado.reduce((a, b) => a + b, 0) / derivadaResultado.length;
    const derivadaMaxima = Math.max(...derivadaResultado.map(Math.abs));
    const derivadaMinima = Math.min(...derivadaResultado);
    const derivadaMaximaAbs = Math.max(...derivadaResultado);

    // Mostrar resultados
    resultados.innerHTML = `
        <h4>Resultado del Cálculo de Derivada</h4>
        <div class="resultado-derivada">
            <p><strong>Función derivada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Diferencias finitas (aproximación numérica)</p>
            <p><strong>Intervalo:</strong> [0, ${datosTiempo[datosTiempo.length - 1].toFixed(2)}] segundos</p>
            <p><strong>Interpretación física:</strong> ${descripcionFisica}</p>
            <p><strong>Número de puntos calculados:</strong> ${derivadaResultado.length}</p>
        </div>
        
        <div class="estadisticas-derivada">
            <h5>Estadísticas de la Derivada</h5>
            <p><strong>Valor promedio:</strong> ${derivadaPromedio.toFixed(4)} ${unidades}</p>
            <p><strong>Valor máximo:</strong> ${derivadaMaximaAbs.toFixed(4)} ${unidades}</p>
            <p><strong>Valor mínimo:</strong> ${derivadaMinima.toFixed(4)} ${unidades}</p>
            <p><strong>Máxima variación:</strong> ${derivadaMaxima.toFixed(4)} ${unidades}</p>
        </div>
        
        <div class="detalles-calculo-derivada">
            <h5>Detalles del Cálculo</h5>
            <p>La derivada se calculó usando diferencias finitas con la fórmula:</p>
            <p class="formula">f'(t) ≈ [f(t₍ᵢ₊₁₎) - f(t₍ᵢ₎)] / Δt</p>
            <p>Donde Δt = ${(datosTiempo[1] - datosTiempo[0]).toFixed(1)} segundos</p>
        </div>
    `;

    // Mostrar la sección de resultados
    document.getElementById("seccion-derivadas").style.display = "block";
}

function calcularDerivadaNumerica(tiempos, valores) {
    if (tiempos.length !== valores.length || tiempos.length < 2) {
        return [];
    }

    let derivada = [];
    
    // Calcular derivada usando diferencias finitas
    for (let i = 0; i < tiempos.length - 1; i++) {
        const deltaT = tiempos[i + 1] - tiempos[i];
        if (deltaT === 0) continue; // Evitar división por cero
        
        const deltaValor = valores[i + 1] - valores[i];
        const derivadaEnPunto = deltaValor / deltaT;
        derivada.push(derivadaEnPunto);
    }

    return derivada;
}

function calcularDerivadaAnaliticamente() {
    const tipoFuncion = document.getElementById("tipo-funcion-derivada").value;
    const resultados = document.getElementById("resultados-derivadas");
    
    if (tipoAceleracionSeleccionada === "constante") {
        calcularDerivadaAnaliticaConstante(tipoFuncion, resultados);
    } else {
        calcularDerivadaAnaliticaVariable(tipoFuncion, resultados);
    }
}

function calcularDerivadaAnaliticaConstante(tipoFuncion, elementoResultados) {
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
    const aceleracion = parseFloat(document.getElementById("aceleracion").value);
    
    let derivada = "";
    let formula = "";
    let unidades = "";
    let descripcion = "";
    let valorConstante = "";

    switch (tipoFuncion) {
        case "posicion":
            // x(t) = x₀ + v₀t + (1/2)at²
            // dx/dt = v₀ + at
            formula = `d/dt[x₀ + ${velocidadInicial}t + (1/2)×${aceleracion}×t²] = ${velocidadInicial} + ${aceleracion}t`;
            derivada = `v(t) = ${velocidadInicial} + ${aceleracion}t`;
            unidades = "m/s";
            descripcion = "Velocidad instantánea";
            valorConstante = `Función lineal con pendiente ${aceleracion} m/s² y ordenada ${velocidadInicial} m/s`;
            break;
        case "velocidad":
            // v(t) = v₀ + at
            // dv/dt = a
            formula = `d/dt[${velocidadInicial} + ${aceleracion}t] = ${aceleracion}`;
            derivada = `a(t) = ${aceleracion}`;
            unidades = "m/s²";
            descripcion = "Aceleración instantánea";
            valorConstante = `Aceleración constante: ${aceleracion} m/s²`;
            break;
        case "aceleracion":
            // a(t) = a (constante)
            // da/dt = 0
            formula = `d/dt[${aceleracion}] = 0`;
            derivada = `jerk(t) = 0`;
            unidades = "m/s³";
            descripcion = "Jerk (cambio de aceleración)";
            valorConstante = `Jerk = 0 m/s³ (aceleración constante)`;
            break;
    }

    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Derivada</h4>
        <div class="resultado-derivada">
            <p><strong>Función derivada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Derivación Analítica</p>
            <p><strong>Función original:</strong> Según ecuaciones de MRUA</p>
            <p><strong>Cálculo:</strong> ${formula}</p>
            <p><strong>Resultado:</strong> ${derivada}</p>
            <p><strong>Unidades:</strong> ${unidades}</p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
            <p><strong>Descripción:</strong> ${valorConstante}</p>
        </div>
    `;

    document.getElementById("seccion-derivadas").style.display = "block";
}

function calcularDerivadaAnaliticaVariable(tipoFuncion, elementoResultados) {
    const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
    
    let derivadaTexto = "";
    let descripcion = "";
    let explicacion = "";

    switch (tipoFuncion) {
        case "posicion":
            derivadaTexto = "dx/dt = v(t) = v₀ + ∫a(t)dt";
            descripcion = "Velocidad instantánea";
            explicacion = "Para obtener la velocidad, se debe integrar la función de aceleración y sumar la velocidad inicial.";
            break;
        case "velocidad":
            derivadaTexto = `dv/dt = a(t) = ${funcionAceleracion}`;
            descripcion = "Aceleración instantánea";
            explicacion = "La derivada de la velocidad es directamente la función de aceleración proporcionada.";
            break;
        case "aceleracion":
            // Intentar calcular la derivada de la función de aceleración usando math.js
            try {
                const expr = math.parse(funcionAceleracion);
                const derivada = math.derivative(expr, 't');
                derivadaTexto = `da/dt = ${derivada.toString()}`;
                explicacion = "Derivada calculada analíticamente de la función de aceleración.";
            } catch (error) {
                derivadaTexto = `da/dt = d/dt[${funcionAceleracion}]`;
                explicacion = "No se pudo calcular la derivada analíticamente. Use el método numérico para obtener valores aproximados.";
            }
            descripcion = "Jerk (cambio de aceleración)";
            break;
    }
    
    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Derivada</h4>
        <div class="resultado-derivada">
            <p><strong>Función derivada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Derivación Analítica (Aceleración Variable)</p>
            <p><strong>Función de aceleración:</strong> a(t) = ${funcionAceleracion}</p>
            <p><strong>Derivada:</strong> ${derivadaTexto}</p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
            <p><strong>Explicación:</strong> ${explicacion}</p>
            ${tipoFuncion === "posicion" ? `<p><strong>Velocidad inicial:</strong> v₀ = ${velocidadInicial} m/s</p>` : ''}
        </div>
    `;
    
    document.getElementById("seccion-derivadas").style.display = "block";
}

/**
 * Intenta obtener la función de velocidad integrando la función de aceleración.
 * @param {string} funcionAceleracion - La expresión de la función de aceleración (ej. "2*t", "3", "sin(t)").
 * @param {number} velocidadInicial - La velocidad inicial (v₀).
 * @returns {string} La expresión de la función de velocidad o un mensaje de error.
 */
function obtenerFuncionVelocidad(funcionAceleracion, velocidadInicial) {
    try {
        const exprA = math.parse(funcionAceleracion);
        // Intentar integrar simbólicamente la función de aceleración
        const integralA = math.simplify(math.integrate(exprA, 't'));
        return `v(t) = ${velocidadInicial} + ${integralA.toString()}`;
    } catch (error) {
        console.error("Error al integrar la función de aceleración para la velocidad:", error);
        return `v(t) = v₀ + ∫a(t)dt  (No se pudo integrar analíticamente esta función)`;
    }
}

/**
 * Intenta obtener la función de posición integrando la función de velocidad.
 * Se asume que la velocidad inicial y la aceleración (si es constante) ya están consideradas en la función de velocidad.
 * @param {string} funcionVelocidad - La expresión de la función de velocidad (ej. "2 + 3*t", "5").
 * @param {number} posicionInicial - La posición inicial (x₀).
 * @returns {string} La expresión de la función de posición o un mensaje de error.
 */
function obtenerFuncionPosicion(funcionVelocidad, posicionInicial) {
    try {
        const exprV = math.parse(funcionVelocidad.replace("v(t) =", "")); // Quitar "v(t) =" para parsear
        // Intentar integrar simbólicamente la función de velocidad
        const integralV = math.simplify(math.integrate(exprV, 't'));
        return `x(t) = ${posicionInicial} + ${integralV.toString()}`;
    } catch (error) {
        console.error("Error al integrar la función de velocidad para la posición:", error);
        return `x(t) = x₀ + ∫v(t)dt (No se pudo integrar analíticamente esta función)`;
    }
}

function mostrarEcuaciones() {
    const tiempoFinal = tiempoActual;
    const velocidadFinal = velocidadActual;

    let ecuacionesTexto = '';

    // Determinar el tipo de movimiento para mostrar las ecuaciones adecuadas
    if (tipoAceleracionSeleccionada === "constante") {
        const aceleracion = parseFloat(document.getElementById("aceleracion").value);

        if (Math.abs(aceleracion) < 0.01) {
            // Ecuaciones MRU
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniforme (MRU):</h3>
                <p><strong>Ecuación de posición:</strong> $x(t) = x_0 + v_0 \\cdot t$</p>
                <p><strong>Reemplazando:</strong> $x(t) = ${posicionInicialGlobal} + ${velocidadInicialGlobal} \\cdot t$</p>
                <p><strong>Valor final:</strong> $x(${tiempoFinal.toFixed(2)}) = ${(posicionInicialGlobal + velocidadInicialGlobal * tiempoFinal).toFixed(2)}$ m</p>
                
                <p><strong>Ecuación de velocidad:</strong> $v(t) = v_0$ (constante)</p>
                <p><strong>Valor:</strong> $v(t) = ${velocidadInicialGlobal}$ m/s</p>
                
                <p><strong>Ecuación de aceleración:</strong> $a(t) = 0$ (sin aceleración)</p>
            `;
        } else {
            // Ecuaciones MRUA
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniformemente Acelerado (MRUA):</h3>
                <p><strong>Ecuación de posición:</strong> $x(t) = x_0 + v_0 \\cdot t + \\frac{1}{2} \\cdot a \\cdot t^2$</p>
                <p><strong>Reemplazando:</strong> $x(t) = ${posicionInicialGlobal} + ${velocidadInicialGlobal} \\cdot t + \\frac{1}{2} \\cdot ${aceleracion} \\cdot t^2$</p>
                <p><strong>Valor final:</strong> $x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)}$ m</p>
                
                <p><strong>Ecuación de velocidad:</strong> $v(t) = v_0 + a \\cdot t$</p>
                <p><strong>Reemplazando:</strong> $v(t) = ${velocidadInicialGlobal} + ${aceleracion} \\cdot t$</p>
                <p><strong>Valor final:</strong> $v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)}$ m/s</p>
                
                <p><strong>Ecuación de aceleración:</strong> $a(t) = ${aceleracion}$ m/s² (constante)</p>
            `;
        }
    } else {
        // Ecuaciones para aceleración variable
        const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
        const funcionVelocidad = obtenerFuncionVelocidad(funcionAceleracion, velocidadInicialGlobal);
        const funcionPosicion = obtenerFuncionPosicion(funcionVelocidad, posicionInicialGlobal);

        ecuacionesTexto = `
            <h3>Movimiento con Aceleración Variable:</h3>
            <p><strong>Función de aceleración:</strong> $a(t) = ${funcionAceleracion}$</p>
            
            <p><strong>Función de velocidad:</strong> ${funcionVelocidad}</p>
            <p><strong>Velocidad inicial:</strong> $v_0 = ${velocidadInicialGlobal}$ m/s</p>
            <p><strong>Velocidad final calculada:</strong> $v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)}$ m/s</p>
            
            <p><strong>Función de posición:</strong> ${funcionPosicion}</p>
            <p><strong>Posición inicial:</strong> $x_0 = ${posicionInicialGlobal}$ m</p>
            <p><strong>Posición final calculada:</strong> $x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)}$ m</p>
        `;
    }

    // Añadir información sobre cálculos numéricos realizados
    ecuacionesTexto += `
        <h3>Método de cálculo numérico utilizado en la simulación:</h3>
        <p>Para el cálculo de la posición y velocidad con aceleración variable (o constante en la simulación paso a paso), se utilizó el método de integración numérica por aproximación de Euler:</p>
        <p>- Para cada paso de tiempo $\\Delta t = 0.1s$:</p>
        <p>- $v(t+\\Delta t) = v(t) + a(t) \\cdot \\Delta t$</p>
        <p>- $x(t+\\Delta t) = x(t) + v(t) \\cdot \\Delta t$</p>
        
        <h3>Resumen de la simulación:</h3>
        <p><strong>Tiempo total:</strong> ${tiempoFinal.toFixed(2)} s</p>
        <p><strong>Distancia recorrida:</strong> ${posicionActual.toFixed(2)} m</p>
        <p><strong>Velocidad inicial:</strong> ${velocidadInicialGlobal} m/s</p>
        <p><strong>Velocidad final:</strong> ${velocidadFinal.toFixed(2)} m/s</p>
    `;

    document.getElementById("ecuaciones-texto").innerHTML = ecuacionesTexto;
}

function reiniciarSimulacion() {
    clearInterval(intervalo);
    enSimulacion = false;
    document.getElementById("btn-iniciar").disabled = false;
    document.getElementById("controles-tiempo-real").style.display = "none";
    document.getElementById("controles-integrales").style.display = "none";
    document.getElementById("seccion-integrales").style.display = "none";
    document.getElementById("seccion-derivadas").style.display = "none";

    // Reiniciar valores
    document.getElementById("auto").style.left = "0px";
    document.getElementById("tiempo").innerText = "0.0";
    document.getElementById("posicion").innerText = "0.0";
    document.getElementById("velocidadActual").innerText = "0.0";
    document.getElementById("aceleracionActual").innerText = "0.0";
    document.getElementById("tipoMovimiento").innerText = "-";

    // Reiniciar aceleración actual
    aceleracionActual = parseFloat(document.getElementById("aceleracion").value);
    document.getElementById("aceleracion-actual").innerText = `Aceleración: ${aceleracionActual.toFixed(1)} m/s²`;

    // Limpiar gráfica
    if (chart) chart.destroy();
    chart = null;

    // Limpiar ecuaciones
    document.getElementById("ecuaciones-texto").innerHTML = "";

    // Reiniciar variables
    tiempoActual = 0;
    velocidadActual = 0;
    posicionActual = 0;
    datosTiempo = [];
    datosVelocidad = [];
    datosPosicion = [];
    datosAceleracion = [];

    // Mostrar valores dinámicos nuevamente
    document.getElementById("valores-dinamicos").style.display = "block";

    // Ocultar estadísticas
    document.getElementById("estadisticas").style.display = "none";

    // Reiniciar variables estadísticas
    velocidadMaxima = 0;
    aceleracionMaxima = 0;
    sumaVelocidades = 0;
    sumaAceleraciones = 0;
    contadorMuestras = 0;

    // Reiniciar variables globales de Ecuaciones
    velocidadInicialGlobal = 0;
    posicionInicialGlobal = 0;
}

function calcularYMostrarEstadisticas() {
    // Calcular estadísticas
    const velocidadMedia = contadorMuestras > 0 ? sumaVelocidades / contadorMuestras : 0;
    const aceleracionMedia = contadorMuestras > 0 ? sumaAceleraciones / contadorMuestras : 0;

    // Actualizar interfaz
    document.getElementById("velocidadMedia").innerText = velocidadMedia.toFixed(2);
    document.getElementById("aceleracionMedia").innerText = aceleracionMedia.toFixed(2);
    document.getElementById("tiempoTotal").innerText = tiempoActual.toFixed(2);
    document.getElementById("distanciaRecorrida").innerText = posicionActual.toFixed(2);
    document.getElementById("velocidadMaxima").innerText = velocidadMaxima.toFixed(2);
    document.getElementById("aceleracionMaxima").innerText = aceleracionMaxima.toFixed(2);
    
    // Copiar el tipo de movimiento de la sección dinámica a la sección de estadísticas
    const tipoMovimientoActual = document.getElementById("tipoMovimiento").innerText;
    const tipoMovimientoEstadisticas = document.querySelector("#estadisticas #tipoMovimiento");
    if (tipoMovimientoEstadisticas) {
        tipoMovimientoEstadisticas.innerText = tipoMovimientoActual;
    }

    // Mostrar el div de estadísticas
    document.getElementById("estadisticas").style.display = "block";
}

window.onload = function () {
    cambiarTipoAceleracion();
};