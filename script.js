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
            // console.error("Error en la función de aceleración:", error);
            // alert("Error en la función de aceleración. Usando valor predeterminado de 2 m/s².");
            return 2; // Valor predeterminado si la función es inválida
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
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);

    const auto = document.getElementById("auto");
    const anchoPista = document.querySelector(".contenedor-animacion").offsetWidth - auto.offsetWidth;

    // Establecer valores iniciales
    tiempoActual = 0;
    posicionActual = 0;
    velocidadActual = velocidadInicial;
    aceleracionActual = calcularAceleracion(0);

    // Variables para gráficas
    datosTiempo = [];
    datosVelocidad = [];
    datosPosicion = [];
    datosAceleracion = [];

    // Inicializar variables estadísticas
    velocidadMaxima = velocidadInicial;
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

    // Si la aceleración es muy cercana a cero, se considera MRU
    if (Math.abs(aceleracionActual) < 0.01 && tipoAceleracionSeleccionada === "constante") {
        tipoMovimiento = "Movimiento Rectilíneo Uniforme (MRU)";
    }
    // Si la aceleración es constante y no cero, se considera MRUA
    else if (tipoAceleracionSeleccionada === "constante" && Math.abs(aceleracionActual) >= 0.01) {
        tipoMovimiento = "Movimiento Rectilíneo Uniformemente Acelerado (MRUA)";
    }
    // Si es variable, se considera Movimiento con Aceleración Variable
    else if (tipoAceleracionSeleccionada === "variable") {
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
            formula = `Integral(v(t)dt) = ${velocidadInicial}t + (1/2)*${aceleracion}*t^2`;
            unidades = "m";
            descripcion = "Desplazamiento total";
            break;
        case "aceleracion":
            // a(t) = a (constante)
            // ∫a dt = at
            integral = aceleracion * tiempoFinal;
            formula = `Integral(a(t)dt) = ${aceleracion}*t`;
            unidades = "m/s";
            descripcion = "Cambio total de velocidad";
            break;
        case "posicion":
            // x(t) = x₀ + v₀t + (1/2)at²
            // ∫x(t)dt = x₀t + (1/2)v₀t² + (1/6)at³
            integral = 0.5 * velocidadInicial * Math.pow(tiempoFinal, 2) + (1/6) * aceleracion * Math.pow(tiempoFinal, 3);
            formula = `Integral(x(t)dt) = (1/2)*${velocidadInicial}*t^2 + (1/6)*${aceleracion}*t^3`;
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
            <p><strong>Nota:</strong> La integración analítica para funciones de aceleración variables complejas requiere un software de álgebra simbólica. El simulador calcula estos valores numéricamente.</p>
            <p><strong>Sugerencia:</strong> Use el método numérico (Regla del Trapecio) para obtener un resultado aproximado para la función específica ingresada.</p>
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
            <p class="formula">f'(t) approx [f(t_final) - f(t_inicial)] / (t_final - t_inicial)</p>
            <p>Donde Delta t = ${(datosTiempo[1] - datosTiempo[0]).toFixed(1)} segundos</p>
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
            formula = `d/dt[x0 + ${velocidadInicial}t + (1/2) * ${aceleracion} * t^2] = ${velocidadInicial} + ${aceleracion}t`;
            derivada = `v(t) = ${velocidadInicial} + ${aceleracion}t`;
            unidades = "m/s";
            descripcion = "Velocidad instantánea";
            valorConstante = `Función lineal con pendiente ${aceleracion} m/s^2 y ordenada ${velocidadInicial} m/s`;
            break;
        case "velocidad":
            // v(t) = v₀ + at
            // dv/dt = a
            formula = `d/dt[${velocidadInicial} + ${aceleracion}t] = ${aceleracion}`;
            derivada = `a(t) = ${aceleracion}`;
            unidades = "m/s^2";
            descripcion = "Aceleración instantánea";
            valorConstante = `Aceleración constante: ${aceleracion} m/s^2`;
            break;
        case "aceleracion":
            // a(t) = a (constante)
            // da/dt = 0
            formula = `d/dt[${aceleracion}] = 0`;
            derivada = `jerk(t) = 0`;
            unidades = "m/s^3";
            descripcion = "Jerk (cambio de aceleración)";
            valorConstante = `Jerk = 0 m/s^3 (aceleración constante)`;
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
            derivadaTexto = "dx/dt = v(t)"; // Se mantiene la explicación integral
            descripcion = "Velocidad instantánea";
            explicacion = "La velocidad es la derivada de la posición. Para una función de aceleración variable, la función de velocidad se obtiene integrando la aceleración. La simulación utiliza cálculos numéricos para esto.";
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
                explicacion = "Derivada calculada analíticamente de la función de aceleración, si es posible con math.js.";
            } catch (error) {
                derivadaTexto = `da/dt = d/dt[${funcionAceleracion}] (math.js no pudo derivar esta expresión analíticamente)`;
                explicacion = "No se pudo calcular la derivada analíticamente de la expresión ingresada. Use el método numérico para obtener valores aproximados.";
            }
            descripcion = "Jerk (cambio de aceleración)";
            break;
    }

    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Derivada</h4>
        <div class="resultado-derivada">
            <p><strong>Función derivada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Derivación Analítica (Aceleración Variable)</p>
            <p><strong>Función de aceleración base:</strong> a(t) = ${funcionAceleracion}</p>
            <p><strong>Derivada:</strong> ${derivadaTexto}</p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
            <p><strong>Explicación:</strong> ${explicacion}</p>
            ${tipoFuncion === "posicion" ? `<p><strong>Velocidad inicial:</strong> v0 = ${velocidadInicial} m/s</p>` : ''}
        </div>
    `;

    document.getElementById("seccion-derivadas").style.display = "block";
}


/**
 * Intenta integrar simbólicamente expresiones polinómicas simples y devuelve las funciones de velocidad y posición.
 * Soporta: constantes, c*t, c*t^2
 * @param {string} accelerationExpression La expresión de la aceleración a(t)
 * @param {number} initialVelocity La velocidad inicial v0
 * @param {number} initialPosition La posición inicial x0
 * @returns {{velocityFn: string, positionFn: string, success: boolean}} Objeto con las funciones de velocidad y posición como strings y un indicador de éxito.
 */
function getSymbolicIntegratedFunctions(accelerationExpression, initialVelocity, initialPosition) {
    let velocityFunction = `v(t) = ${initialVelocity} + Integral(a(t)dt)`;
    let positionFunction = `x(t) = ${initialPosition} + Integral(v(t)dt)`;
    let success = false;

    try {
        const node = math.parse(accelerationExpression);

        // Caso: a(t) = C (constante)
        if (node.type === 'ConstantNode' || (node.type === 'OperatorNode' && node.fn === 'unaryminus')) {
            const C = math.evaluate(accelerationExpression, {t: 0}); // Evaluar la constante
            velocityFunction = `v(t) = ${initialVelocity} + ${C}*t`;
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t + (1/2)*${C}*t^2`;
            success = true;
        }
        // Caso: a(t) = C*t
        else if (node.type === 'OperatorNode' && node.op === '*' && node.args[1] && node.args[1].type === 'SymbolNode' && node.args[1].name === 't' && node.args[0].type === 'ConstantNode') {
            const C = node.args[0].value;
            velocityFunction = `v(t) = ${initialVelocity} + (1/2)*${C}*t^2`;
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t + (1/6)*${C}*t^3`;
            success = true;
        }
        // Caso: a(t) = C*t^2
        else if (node.type === 'OperatorNode' && node.op === '*' && node.args[1] && node.args[1].type === 'OperatorNode' && node.args[1].op === '^' && node.args[1].args[0] && node.args[1].args[0].type === 'SymbolNode' && node.args[1].args[0].name === 't' && node.args[1].args[1].type === 'ConstantNode' && node.args[1].args[1].value === 2 && node.args[0].type === 'ConstantNode') {
            const C = node.args[0].value;
            velocityFunction = `v(t) = ${initialVelocity} + (1/3)*${C}*t^3`;
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t + (1/12)*${C}*t^4`;
            success = true;
        }
        // Caso: a(t) = t (asume 1*t)
        else if (node.type === 'SymbolNode' && node.name === 't') {
            velocityFunction = `v(t) = ${initialVelocity} + (1/2)*t^2`;
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t + (1/6)*t^3`;
            success = true;
        }
        // Caso: a(t) = t^2 (asume 1*t^2)
        else if (node.type === 'OperatorNode' && node.op === '^' && node.args[0] && node.args[0].type === 'SymbolNode' && node.args[0].name === 't' && node.args[1].type === 'ConstantNode' && node.args[1].value === 2) {
            velocityFunction = `v(t) = ${initialVelocity} + (1/3)*t^3`;
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t + (1/12)*t^4`;
            success = true;
        }
        // Puedes añadir más casos aquí para funciones simples como sen(t), cos(t), exp(t)
        // Por ejemplo, para sin(t):
        else if (node.type === 'FunctionNode' && node.name === 'sin' && node.args[0] && node.args[0].type === 'SymbolNode' && node.args[0].name === 't') {
            velocityFunction = `v(t) = ${initialVelocity} - cos(t) + ${math.cos(0)}`; // + C (valor para t=0)
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t - sin(t) + ${math.cos(0)}*t - ${math.sin(0)}`; // Ajustar constante de integración
            success = true;
        }
        // Para cos(t):
        else if (node.type === 'FunctionNode' && node.name === 'cos' && node.args[0] && node.args[0].type === 'SymbolNode' && node.args[0].name === 't') {
            velocityFunction = `v(t) = ${initialVelocity} + sin(t) - ${math.sin(0)}`; // + C (valor para t=0)
            positionFunction = `x(t) = ${initialPosition} + ${initialVelocity}*t - cos(t) + ${math.sin(0)}*t + ${math.cos(0)}`; // Ajustar constante de integración
            success = true;
        }

    } catch (e) {
        // console.warn("No se pudo parsear o integrar simbólicamente la expresión:", accelerationExpression, e);
        success = false;
    }

    return { velocityFn: velocityFunction, positionFn: positionFunction, success: success };
}


function mostrarEcuaciones() {
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
    const tiempoFinal = tiempoActual;
    const velocidadFinal = velocidadActual;
    const posicionInicial = 0; // Asumimos posición inicial 0

    let ecuacionesTexto = '';

    if (tipoAceleracionSeleccionada === "constante") {
        const aceleracion = parseFloat(document.getElementById("aceleracion").value);

        if (Math.abs(aceleracion) < 0.01) {
            // Ecuaciones MRU
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniforme (MRU):</h3>
                <p><strong>Ecuacion de posicion:</strong> x(t) = x0 + v * t</p>
                <p><strong>Reemplazando:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionInicial} + ${velocidadInicial} * ${tiempoFinal.toFixed(2)}</p>
                <p><strong>Valor final:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuacion de velocidad:</strong> v(t) = v0 (constante)</p>
                <p><strong>Valor:</strong> v = ${velocidadInicial} m/s</p>

                <p><strong>Ecuacion de aceleracion:</strong> a(t) = 0 m/s^2 (sin aceleracion)</p>
            `;
        } else {
            // Ecuaciones MRUA
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniformemente Acelerado (MRUA):</h3>
                <p><strong>Ecuacion de posicion:</strong> x(t) = x0 + v0 * t + (1/2) * a * t^2</p>
                <p><strong>Reemplazando:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionInicial} + ${velocidadInicial} * ${tiempoFinal.toFixed(2)} + (1/2) * ${aceleracion} * ${tiempoFinal.toFixed(2)}^2</p>
                <p><strong>Valor final:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuacion de velocidad:</strong> v(t) = v0 + a * t</p>
                <p><strong>Reemplazando:</strong> v(${tiempoFinal.toFixed(2)}) = ${velocidadInicial} + ${aceleracion} * ${tiempoFinal.toFixed(2)}</p>
                <p><strong>Valor final:</strong> v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)} m/s</p>

                <p><strong>Ecuacion de aceleracion:</strong> a(t) = ${aceleracion} m/s^2 (constante)</p>
            `;
        }
    } else {
        // Ecuaciones para aceleración variable
        const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
        const { velocityFn, positionFn, success } = getSymbolicIntegratedFunctions(funcionAceleracion, velocidadInicial, posicionInicial);

        ecuacionesTexto = `
            <h3>Movimiento con Aceleracion Variable:</h3>
            <p><strong>Funcion de aceleracion:</strong> a(t) = ${funcionAceleracion}</p>
        `;

        if (success) {
            ecuacionesTexto += `
                <p><strong>Ecuacion de velocidad:</strong> ${velocityFn}</p>
                <p><strong>Valor final:</strong> v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)} m/s</p>
                <p><strong>Ecuacion de posicion:</strong> ${positionFn}</p>
                <p><strong>Valor final:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>
                <p><em>Estas ecuaciones se han derivado analíticamente para una función de aceleración polinómica simple.</em></p>
            `;
        } else {
            ecuacionesTexto += `
                <p><strong>Ecuacion de velocidad:</strong> v(t) = v0 + (integral de a(t) con respecto a t)</p>
                <p><strong>Velocidad inicial:</strong> v0 = ${velocidadInicial} m/s</p>
                <p><strong>Velocidad final calculada:</strong> v = ${velocidadFinal.toFixed(2)} m/s</p>

                <p><strong>Ecuacion de posicion:</strong> x(t) = x0 + (integral de v(t) con respecto a t)</p>
                <p><strong>Posicion final calculada:</strong> x = ${posicionActual.toFixed(2)} m</p>
                <p><em>Para funciones de aceleración variables complejas, las ecuaciones analíticas de velocidad y posición exactas requieren un software de álgebra simbólica avanzado. La simulación calcula estos valores numéricamente.</em></p>
            `;
        }
    }

    // Añadir información sobre cálculos numéricos realizados
    ecuacionesTexto += `
        <h3>Metodo de calculo numerico utilizado en la simulacion:</h3>
        <p>Para el calculo de la posicion y velocidad con aceleracion variable (o constante en la simulación paso a paso), se utilizo el metodo de integracion numerica por aproximacion de Euler:</p>
        <p>- Para cada paso de tiempo Delta t = 0.1s:</p>
        <p>- v(t + Delta t) = v(t) + a(t) * Delta t</p>
        <p>- x(t + Delta t) = x(t) + v(t) * Delta t</p>

        <h3>Resumen de la simulacion:</h3>
        <p><strong>Tiempo total:</strong> ${tiempoFinal.toFixed(2)} s</p>
        <p><strong>Distancia recorrida:</strong> ${posicionActual.toFixed(2)} m</p>
        <p><strong>Velocidad inicial:</strong> ${velocidadInicial} m/s</p>
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