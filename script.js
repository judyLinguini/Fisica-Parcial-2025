let intervalo;
let chart;
let tipoAceleracionSeleccionada = "constante";
let aceleracionActual = 2;
let enSimulacion = false;
let tiempoActual = 0;
let velocidadActual = 0;
let posicionActual = 0;
let valorAceleracionVariable = 0; // Esta variable parece no usarse, se puede revisar
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
            formula = `Integral(v(t)dt) = ${velocidadInicial}t + 0.5 * ${aceleracion} * t²`;
            unidades = "m";
            descripcion = "Desplazamiento total";
            break;
        case "aceleracion":
            // a(t) = a (constante)
            // ∫a dt = at
            integral = aceleracion * tiempoFinal;
            formula = `Integral(a(t)dt) = ${aceleracion} * t`;
            unidades = "m/s";
            descripcion = "Cambio total de velocidad";
            break;
        case "posicion":
            // x(t) = x₀ + v₀t + (1/2)at²
            // ∫x(t)dt = x₀t + (1/2)v₀t² + (1/6)at³
            integral = 0.5 * velocidadInicial * Math.pow(tiempoFinal, 2) + (1/6) * aceleracion * Math.pow(tiempoFinal, 3);
            formula = `Integral(x(t)dt) = 0.5 * ${velocidadInicial} * t² + (1/6) * ${aceleracion} * t³`;
            unidades = "m·s";
            descripcion = "Área bajo la curva de posición";
            break;
    }

    elementoResultados.innerHTML = `
        <h4>Cálculo Analítico de la Integral</h4>
        <div class="resultado-integral">
            <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
            <p><strong>Método:</strong> Integración Analítica</p>
            <p><strong>Fórmula:</strong> $<span class="math-inline">\{formula\}</span></p>
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
            <p><strong>Función de aceleración:</strong> $a(t) = <span class="math-inline">\{funcionAceleracion\}</span></p>
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
            <p class="formula"><span class="math-inline">f'\(t\) \\\\approx \[f\(t\_\{final\}\) \- f\(t\_\{inicial\}\)\] / \(t\_\{final\} \- t\_\{inicial\}\)</span></p>
            <p>Donde $\\Delta t = <span class="math-inline">\{\(datosTiempo\[1\] \- datosTiempo\[0\]\)\.toFixed\(1\)\}</span> segundos</p>
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
            // x(t) = x₀ + v₀t + 0.5at²
            // dx/dt = v₀ + at
            formula = `d/dt[x₀ + ${velocidadInicial}t + 0.5 * ${aceleracion} * t²] = ${velocidadInicial} + ${aceleracion}t`;
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
            <p><strong>Cálculo:</strong> $<span class="math-inline">\{formula\}</span></p>
            <p><strong>Resultado:</strong> $<span class="math-inline">\{derivada\}</span></p>
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
            <p><strong>Función de aceleración base:</strong> $a(t) = <span class="math-inline">\{funcionAceleracion\}</span></p>
            <p><strong>Derivada:</strong> $<span class="math-inline">\{derivadaTexto\}</span></p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
            <p><strong>Explicación:</strong> ${explicacion}</p>
            ${tipoFuncion === "posicion" ? `<p><strong>Velocidad inicial:</strong> $v₀ = ${velocidadInicial}$ m/s</p>` : ''}
        </div>
    `;

    document.getElementById("seccion-derivadas").style.display = "block";
}


/**
 * Intenta integrar simbólicamente expresiones polinómicas simples y devuelve las funciones de velocidad y posición.
 * Soporta: constantes, c*t, c*t^n (n entero), c*sin(t), c*cos(t), c*exp(t).
 * También maneja sumas y restas de estos términos.
 * @param {string} accelerationExpression La expresión de la aceleración a(t)
 * @param {number} initialVelocity La velocidad inicial v0
 * @param {number} initialPosition La posición inicial x0
 * @returns {{velocityExpression: string, positionExpression: string, success: boolean}} Objeto con las expresiones de velocidad y posición como strings (solo RHS) y un indicador de éxito.
 */
function getSymbolicIntegratedFunctions(accelerationExpression, initialVelocity, initialPosition) {
    let velocityExpression = `v₀ + \\int a(t)dt`;
    let positionExpression = `x₀ + \\int v(t)dt`;
    let successVelocity = false;
    let successPosition = false;

    console.log("Attempting symbolic integration for acceleration expression:", accelerationExpression);

    try {
        const nodeAceleracion = math.parse(accelerationExpression);
        console.log("Parsed acceleration node (a(t)):", nodeAceleracion.toString(), "Type:", nodeAceleracion.type);

        const integratedAcelerationNode = integrateNode(nodeAceleracion, 't');
        console.log("Result of integrateNode for acceleration:", integratedAcelerationNode ? integratedAcelerationNode.toString() : 'NULL');


        if (integratedAcelerationNode) {
            console.log("Integrated acceleration node (raw):", integratedAcelerationNode.toString());
            let simplifiedIntegratedAceleration = math.simplify(integratedAcelerationNode).toString();
            // Si la expresión es vacía después de simplificar (ej. integral de 0), ajustarla a "0"
            if (simplifiedIntegratedAceleration.trim() === '') {
                simplifiedIntegratedAceleration = '0';
            }
            console.log("Integrated acceleration node (simplified):", simplifiedIntegratedAceleration);


            // Construir la función de velocidad con v0 usando toString()
            let velocityExprNode = math.parse(`<span class="math-inline">\{initialVelocity\} \+ \(</span>{simplifiedIntegratedAceleration})`);
            velocityExprNode = math.simplify(velocityExprNode); // Simplificar la expresión de velocidad también
            velocityExpression = velocityExprNode.toString(); // Usar toString()
            successVelocity = true;
            console.log("Calculated velocity expression:", velocityExpression);


            // Intentar integrar la función de velocidad para obtener la posición
            const integratedVelocityNode = integrateNode(velocityExprNode, 't');
            console.log("Result of integrateNode for velocity:", integratedVelocityNode ? integratedVelocityNode.toString() : 'NULL');

            if (integratedVelocityNode) {
                console.log("Integrated velocity node (raw):", integratedVelocityNode.toString());
                let simplifiedIntegratedVelocity = math.simplify(integratedVelocityNode).toString();
                if (simplifiedIntegratedVelocity.trim() === '') {
                    simplifiedIntegratedVelocity = '0';
                }
                console.log("Integrated velocity node (simplified):", simplifiedIntegratedVelocity);


                // Construir la función de posición con x0 usando toString()
                let positionExprNode = math.parse(`<span class="math-inline">\{initialPosition\} \+ \(</span>{simplifiedIntegratedVelocity})`);
                positionExprNode = math.simplify(positionExprNode); // Simplificar la expresión de posición también
                positionExpression = positionExprNode.toString(); // Usar toString()
                successPosition = true;
                console.log("Calculated position expression:", positionExpression);
            } else {
                console.log("integratedVelocityNode is NULL. successPosition remains false.");
            }
        } else {
            console.log("integratedAcelerationNode is NULL. successVelocity remains false.");
        }
    } catch (e) {
        console.error("Error in getSymbolicIntegratedFunctions:", e);
        // Fallback a las integrales no resueltas si hay algún error
        successVelocity = false;
        successPosition = false;
    }

    console.log("Symbolic integration final success:", successVelocity && successPosition);
    return {
        // Los strings son solo la RHS de la expresión
        velocityExpression: successVelocity ? velocityExpression : `v₀ + \\int a(t)dt \\text{ (No analitica, use numérico)}`,
        positionExpression: successPosition ? positionExpression : `x₀ + \\int v(t)dt \\text{ (No analitica, use numérico)}`,
        success: successVelocity && successPosition // Solo éxito si ambas integraciones fueron analíticas
    };
}


/**
 * Intenta integrar un nodo de math.js. Función auxiliar para getSymbolicIntegratedFunctions.
 * Implementa reglas básicas de integración para polinomios, senos, cosenos, exponenciales.
 * @param {math.MathNode} node El nodo de la expresión a integrar.
 * @param {string} variable La variable de integración (e.g., 't').
 * @returns {math.MathNode | null} El nodo de la integral o null si no se puede integrar.
 */
function integrateNode(node, variable) {
    console.log(`[integrateNode] Integrating: ${node.toString()} (Type: ${node.type})`);

    if (node.type === 'ConstantNode') {
        // Integral de una constante C es C*variable
        // Asegúrate de que 0 se integre a 0, no a 0*t
        if (node.value === 0) {
            const result = new math.ConstantNode(0);
            console.log(`[integrateNode] Constant 0 integral result: ${result.toString()}`);
            return result;
        }
        const result = new math.OperatorNode(new math.ConstantNode(node.value), '*', new math.SymbolNode(variable));
        console.log(`[integrateNode] Constant integral result: ${result.toString()}`);
        return result;
    } else if (node.type === 'SymbolNode' && node.name === variable) {
        // Integral de t es (1/2)*t^2
        const result = new math.OperatorNode(new math.OperatorNode(new math.ConstantNode(1), '/', new math.ConstantNode(2)), '*', new math.OperatorNode(new math.SymbolNode(variable), '^', new math.ConstantNode(2)));
        console.log(`[integrateNode] Symbol '${variable}' integral result: ${result.toString()}`);
        return result;
    } else if (node.type === 'OperatorNode' && node.op === '^' && node.args[0] && node.args[0].type === 'SymbolNode' && node.args[0].name === variable && node.args[1] && node.args[1].type === 'ConstantNode') {
        // Integral de t^n es (1/(n+1))*t^(n+1)
        const power = node.args[1].value;
        const newPower = power + 1;
        const coefficient = new math.Fraction(1, newPower);
        const result = new math.OperatorNode(new math.ConstantNode(coefficient.valueOf()), '*', new math.OperatorNode(new math.SymbolNode(variable), '^', new math.ConstantNode(newPower)));
        console.log(`[integrateNode] Power integral result: ${result.toString()}`);
        return result;
    } else if (node.type === 'OperatorNode' && node.op === '*' && node.args.length === 2) {
        // Integral de C*f(t) es C*Integral(f(t))
        let constantNode = null;
        let funcNode = null;

        // Identificar la constante y la función. La constante puede estar a la izquierda o derecha.
        if (node.args[0].type === 'ConstantNode') {
            constantNode = node.args[0];
            funcNode = node.args[1];
        } else if (node.args[1].type === 'ConstantNode') {
            constantNode = node.args[1];
            funcNode = node.args[0];
        }

        if (constantNode && funcNode) {
            console.log(`[integrateNode] Found constant-function product: Constant=<span class="math-inline">\{constantNode\.toString\(\)\} Function\=</span>{funcNode.toString()}`);
            const integratedFuncNode = integrateNode(funcNode, variable);
            if (integratedFuncNode) {
                // Return C * integral(f(t))
                const result = new math.OperatorNode(constantNode, '*', integratedFuncNode);
                console.log(`[integrateNode] Product integral result: ${result.toString()}`);
                return result;
            }
        }
    } else if (node.type === 'OperatorNode' && (node.op === '+' || node.op === '-')) {
        // Integral de f(t) +/- g(t) es Integral(f(t)) +/- Integral(g(t))
        console.log(`[integrateNode] Found sum/difference node. Args: ${node.args.map(a => a.toString())}`);
        const integratedArgs = node.args.map(arg => integrateNode(arg, variable));
        if (integratedArgs.every(arg => arg !== null)) {
            // Reconstruir el nodo con los argumentos integrados
            let newNode = integratedArgs[0];
            for (let i = 1; i < integratedArgs.length; i++) {
                newNode = new math.OperatorNode(newNode, node.op, integratedArgs[i]);
            }
            console.log(`[integrateNode] Sum/Difference integral result: ${newNode.toString()}`);
            return newNode;
        }
    } else if (node.type === 'FunctionNode') {
        // Integrales de funciones trigonométricas/exponenciales simples
        if (node.name === 'sin' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            // Integral de sin(t) es -cos(t)
            const result = new math.OperatorNode(new math.ConstantNode(-1), '*', new math.FunctionNode('cos', [new math.SymbolNode(variable)]));
            console.log(`[integrateNode] Sin integral result: ${result.toString()}`);
            return result;
        } else if (node.name === 'cos' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            // Integral de cos(t) es sin(t)
            const result = new math.FunctionNode('sin', [new math.SymbolNode(variable)]);
            console.log(`[integrateNode] Cos integral result: ${result.toString()}`);
            return result;
        } else if (node.name === 'exp' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            // Integral de exp(t) es exp(t)
            const result = new math.FunctionNode('exp', [new math.SymbolNode(variable)]);
            console.log(`[integrateNode] Exp integral result: ${result.toString()}`);
            return result;
        } else if (node.name === 'log' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            // Integral de log(t) es t*log(t) - t
            const result = math.parse(`t * log(t) - t`);
            console.log(`[integrateNode] Log integral result: ${result.toString()}`);
            return result;
        } else if (node.name === 'log10' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            // Integral de log10(t) es t*log10(t) - t/ln(10)
            const result = math.parse(`t * log10(t) - t / log(10)`);
            console.log(`[integrateNode] Log10 integral result: ${result.toString()}`);
            return result;
        }
    } else if (node.type === 'OperatorNode' && node.op === 'unaryminus') {
        // Integral de -f(t) es -Integral(f(t))
        console.log(`[integrateNode] Found unaryminus node. Arg: ${node.args[0].toString()}`);
        const integratedArg = integrateNode(node.args[0], variable);
        if (integratedArg) {
            const result = new math.OperatorNode(integratedArg, 'unaryminus');
            console.log(`[integrateNode] Unaryminus integral result: ${result.toString()}`);
            return result;
        }
    }

    console.log(`[integrateNode] Failed to integrate: ${node.toString()} (Type: ${node.type}). Returning NULL.`);
    return null; // No se pudo integrar
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
            // Ecuaciones MRU (sin $)
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniforme (MRU):</h3>
                <p><strong>Ecuación de posición:</strong> x(t) = x₀ + v₀t</p>
                <p><strong>Reemplazando:</strong> x(t) = ${posicionInicial} + ${velocidadInicial} * t</p>
                <p><strong>Para t = <span class="math-inline">\{tiempoFinal\.toFixed\(2\)\} s\:</strong\> x\(</span>{tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ (constante)</p>
                <p><strong>Valor:</strong> v = ${velocidadInicial} m/s</p>

                <p><strong>Ecuación de aceleración:</strong> a(t) = 0 m/s² (sin aceleración)</p>
            `;
        } else {
            // Ecuaciones MRUA (sin $)
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniformemente Acelerado (MRUA):</h3>
                <p><strong>Ecuación de posición:</strong> x(t) = x₀ + v₀t + 0.5 * a * t²</p>
                <p><strong>Reemplazando:</strong> x(t) = ${posicionInicial} + ${velocidadInicial} * t + 0.5 * ${aceleracion} * t²</p>
                <p><strong>Para t = <span class="math-inline">\{tiempoFinal\.toFixed\(2\)\} s\:</strong\> x\(</span>{tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ + a * t</p>
                <p><strong>Reemplazando:</strong> v(t) = ${velocidadInicial} + ${aceleracion} * t</p>
                <p><strong>Para t = <span class="math-inline">\{tiempoFinal\.toFixed\(2\)\} s\:</strong\> v\(</span>{tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)} m/s</p>

                <p><strong>Ecuación de aceleración:</strong> a(t) = ${aceleracion} m/s² (constante)</p>
            `;
        }
    } else {
        // Ecuaciones para aceleración variable (con $)
        const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
        const { velocityExpression, positionExpression, success } = getSymbolicIntegratedFunctions(funcionAceleracion, velocidadInicial, posicionInicial);

        ecuacionesTexto = `
            <h3>Movimiento con Aceleración Variable:</h3>
            <p><strong>Función de aceleración ingresada:</strong> $a(t) = <span class="math-inline">\{funcionAceleracion\}</span></p>
        `;

        if (success) {
            // Aplicar reemplazos de subíndices y envolver en $ para MathJax
            const displayVelocityExpression = velocityExpression.replace(/v_0/g, 'v₀').replace(/x_0/g, 'x₀');
            const displayPositionExpression = positionExpression.replace(/v_0/g, 'v₀').replace(/x_0/g, 'x₀');

            ecuacionesTexto += `
                <p><strong>Ecuación de velocidad:</strong> $v(t) = <span class="math-inline">\{displayVelocityExpression\}</span></p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> <span class="math-inline">v\(</span>{tiempoFinal.toFixed(2)}) = <span class="math-inline">\{velocidadFinal\.toFixed\(2\)\}</span> m/s</p>
                <p><strong>Ecuación de posición:</strong> $x(t) = <span class="math-inline">\{displayPositionExpression\}</span></p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> <span class="math-inline">x\(</span>{tiempoFinal.toFixed(2)}) = <span class="math-inline">\{posicionActual\.toFixed\(2\)\}</span> m</p>
                <p><em>Estas ecuaciones se han derivado analíticamente.</em></p>
            `;
        } else {
            ecuacionesTexto += `
                <p><strong>Ecuación de velocidad:</strong> <span class="math-inline">v\(t\) \= v₀ \+ \\\\int a\(t\)dt</span></p>
                <p><strong>Velocidad inicial:</strong> $v₀ = <span class="math-inline">\{velocidadInicial\}</span> m/s</p>
                <p><strong>Velocidad final calculada (numéricamente):</strong> $v = <span class="math-inline">\{velocidadFinal\.toFixed\(2\)\}</span> m/s</p>

                <p><strong>Ecuación de posición:</strong> <span class="math-inline">x\(t\) \= x₀ \+ \\\\int v\(t\)dt</span></p>
                <p><strong>Posición final calculada (numéricamente):</strong> $x = <span class="math-inline">\{posicionActual\.toFixed\(2\)\}</span> m</p>
                <p><em>Para funciones de aceleración variables complejas (o cuando no se puede integrar con \`math.js\`), las ecuaciones analíticas de velocidad y posición exactas requieren un software de álgebra simbólica avanzado. La simulación calcula estos valores numéricamente.</em></p>
            `;
        }
    }

    // Añadir información sobre cálculos numéricos realizados
    ecuacionesTexto += `
        <h3>Método de cálculo numérico utilizado en la simulación:</h3>
        <p>Para el cálculo de la posición y velocidad con aceleración variable (o constante en la simulación paso a paso), se utilizó el método de integración numérica por aproximación de Euler:</p>
        <p><span class="math-inline">\\\\text\{Para cada paso de tiempo \} \\\\Delta t \= 0\.1s\:</span></p>
        <p><span class="math-inline">v\(t \+ \\\\Delta t\) \= v\(t\) \+ a\(t\) \\\\cdot \\\\Delta t</span></p>
        <p><span class="math-inline">x\(t \+ \\\\Delta t\) \= x\(t\) \+ v\(t\) \\\\cdot \\\\Delta t</span></p>

        <h3>Resumen de la simulación:</h3>
        <p><strong>Tiempo total:</strong> ${tiempoFinal.toFixed(2)} s</p>
        <p><strong>Distancia recorrida:</strong> ${posicionActual.toFixed(2)} m</p>
        <p><strong>Velocidad inicial:</strong> ${velocidadInicial} m/s</p>
        <p><strong>Velocidad final:</strong> ${velocidadFinal.toFixed(2)} m/s</p>
    `;

    document.getElementById("ecuaciones-texto").innerHTML = ecuacionesTexto;

    // Renderizar las ecuaciones LaTeX con MathJax
    // Solo se llama si hay MathJax en el contenido
    if (window.MathJax) {
        window.MathJax.typesetPromise().then(() => {
            // Optional: Do something after typesetting if needed
        }).catch((err) => console.error('MathJax typesetting failed:', err));
    }
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
    // Cargar MathJax una vez que el DOM esté listo
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    document.head.appendChild(script);
};