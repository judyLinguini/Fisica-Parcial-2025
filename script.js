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

        // Ecuaciones de movimiento con aceleración variable
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
            formula = `∫(${velocidadInicial}t + (1/2)×${aceleracion}×t²)dt = (1/2)×${velocidadInicial}×t² + (1/6)×${aceleracion}×t³`;
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

function mostrarEcuaciones() {
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
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
                <p><strong>Ecuación de posición:</strong> x = x₀ + v * t</p>
                <p><strong>Reemplazando:</strong> x = 0 + ${velocidadInicial} * ${tiempoFinal.toFixed(2)}</p>
                <p><strong>Resultado:</strong> x = ${(velocidadInicial * tiempoFinal).toFixed(2)} m</p>
                
                <p><strong>Ecuación de velocidad:</strong> v = v₀ (constante)</p>
                <p><strong>Valor:</strong> v = ${velocidadInicial} m/s</p>
                
                <p><strong>Ecuación de aceleración:</strong> a = 0 (sin aceleración)</p>
            `;
        } else {
            // Ecuaciones MRUA
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniformemente Acelerado (MRUA):</h3>
                <p><strong>Ecuación de posición:</strong> x = x₀ + v₀ * t + (1/2) * a * t²</p>
                <p><strong>Reemplazando:</strong> x = 0 + ${velocidadInicial} * ${tiempoFinal.toFixed(2)} + (1/2) * ${aceleracion} * (${tiempoFinal.toFixed(2)})²</p>
                <p><strong>Resultado:</strong> x = ${posicionActual.toFixed(2)} m</p>
                
                <p><strong>Ecuación de velocidad:</strong> v = v₀ + a * t</p>
                <p><strong>Reemplazando:</strong> v = ${velocidadInicial} + ${aceleracion} * ${tiempoFinal.toFixed(2)}</p>
                <p><strong>Resultado:</strong> v = ${velocidadFinal.toFixed(2)} m/s</p>
                
                <p><strong>Ecuación de aceleración:</strong> a = ${aceleracion} m/s² (constante)</p>
            `;
        }
    } else {
        // Ecuaciones para aceleración variable
        const funcionAceleracion = document.getElementById("funcion-aceleracion").value;

        ecuacionesTexto = `
            <h3>Movimiento con Aceleración Variable:</h3>
            <p><strong>Función de aceleración:</strong> a(t) = ${funcionAceleracion}</p>
            
            <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ + ∫a(t)dt</p>
            <p><strong>Velocidad inicial:</strong> v₀ = ${velocidadInicial} m/s</p>
            <p><strong>Velocidad final calculada:</strong> v = ${velocidadFinal.toFixed(2)} m/s</p>
            
            <p><strong>Ecuación de posición:</strong> x(t) = x₀ + ∫v(t)dt</p>
            <p><strong>Posición final calculada:</strong> x = ${posicionActual.toFixed(2)} m</p>
        `;
    }

    // Añadir información sobre cálculos numéricos realizados
    ecuacionesTexto += `
        <h3>Método de cálculo numérico utilizado:</h3>
        <p>Para el cálculo de la posición y velocidad con aceleración variable, se utilizó el método de integración numérica por aproximación de Euler:</p>
        <p>- Para cada paso de tiempo Δt = 0.1s:</p>
        <p>- v(t+Δt) = v(t) + a(t) * Δt</p>
        <p>- x(t+Δt) = x(t) + v(t) * Δt</p>
        
        <h3>Resumen de la simulación:</h3>
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
    document.getElementById("estadisticas").querySelector("#tipoMovimiento").innerText = tipoMovimientoActual;

    // Mostrar el div de estadísticas
    document.getElementById("estadisticas").style.display = "block";
}

window.onload = function () {
    cambiarTipoAceleracion();
};