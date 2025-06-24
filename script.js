let intervalo;
let chart;
let tipoAceleracionSeleccionada = "constante";
let aceleracionActual = 2;
let enSimulacion = false;
let tiempoActual = 0;
let velocidadActual = 0;
let posicionActual = 0;
let valorAceleracionVariable = 0; // Esta variable parece no usarse, pero si la borro falla. WTF?
let distanciaTotal = 0;

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
            return 2; 
        }
    }
}

function iniciarSimulacion() {
    if (enSimulacion) return;

    reiniciarSimulacion();
    enSimulacion = true;

    document.getElementById("controles-tiempo-real").style.display = "block";
    document.getElementById("btn-iniciar").disabled = true;

    distanciaTotal = parseFloat(document.getElementById("distancia").value);
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);

    const auto = document.getElementById("auto");
    const anchoPista = document.querySelector(".contenedor-animacion").offsetWidth - auto.offsetWidth;

    tiempoActual = 0;
    posicionActual = 0;
    velocidadActual = velocidadInicial;
    aceleracionActual = calcularAceleracion(0);

    datosTiempo = [];
    datosVelocidad = [];
    datosPosicion = [];
    datosAceleracion = [];

    velocidadMaxima = velocidadInicial;
    aceleracionMaxima = 0;
    sumaVelocidades = 0;
    sumaAceleraciones = 0;
    contadorMuestras = 0;

    document.getElementById("estadisticas").style.display = "none";

    actualizarTipoMovimiento();

    intervalo = setInterval(() => {
        if (posicionActual >= distanciaTotal) {
            finalizarSimulacion();
            return;
        }

        aceleracionActual = calcularAceleracion(tiempoActual);

        const deltaT = 0.1; // incremento de tiempo en segundos

        velocidadActual += aceleracionActual * deltaT;
        posicionActual += velocidadActual * deltaT;

        const porcentajePosicion = (posicionActual / distanciaTotal) * anchoPista;
        auto.style.left = `${Math.min(porcentajePosicion, anchoPista)}px`;

        sumaVelocidades += velocidadActual;
        sumaAceleraciones += aceleracionActual;
        contadorMuestras++;

        velocidadMaxima = Math.max(velocidadMaxima, velocidadActual);
        aceleracionMaxima = Math.max(Math.abs(aceleracionMaxima), Math.abs(aceleracionActual)); // Usar Math.abs para aceleracionMaxima

        document.getElementById("tiempo").innerText = tiempoActual.toFixed(1);
        document.getElementById("posicion").innerText = posicionActual.toFixed(2);
        document.getElementById("velocidadActual").innerText = velocidadActual.toFixed(2);
        document.getElementById("aceleracionActual").innerText = aceleracionActual.toFixed(2);

        actualizarTipoMovimiento();

        datosTiempo.push(tiempoActual);
        datosVelocidad.push(velocidadActual);
        datosPosicion.push(posicionActual);
        datosAceleracion.push(aceleracionActual);

        actualizarGrafica();

        tiempoActual += deltaT;
    }, 100);
}

function finalizarSimulacion() {
    clearInterval(intervalo);
    enSimulacion = false;
    document.getElementById("btn-iniciar").disabled = false;

    document.getElementById("valores-dinamicos").style.display = "none";
    document.getElementById("controles-tiempo-real").style.display = "none";

    generarGraficaFinal();

    calcularYMostrarEstadisticas();

    mostrarEcuaciones();

    document.getElementById("controles-integrales").style.display = "block";
}

function cambiarAceleracionTiempoReal(cambio) {
    if (!enSimulacion) return;

    if (tipoAceleracionSeleccionada === "constante") {
        aceleracionActual += cambio;
        document.getElementById("aceleracion").value = aceleracionActual;
        document.getElementById("aceleracion-actual").innerText = `Aceleración: ${aceleracionActual.toFixed(1)} m/s²`;
    } else {
        try {
            let expresion = document.getElementById("funcion-aceleracion").value;
            let factorActual = 1;

            const regex = /^(\d+(\.\d+)?)\*(.+)/;
            const match = expresion.match(regex);

            if (match) {
                factorActual = parseFloat(match[1]);
                const nuevaExpresion = (factorActual + cambio) + "*" + match[3];
                document.getElementById("funcion-aceleracion").value = nuevaExpresion;
            } else {
                document.getElementById("funcion-aceleracion").value = (1 + cambio) + "*(" + expresion + ")";
            }

            document.getElementById("aceleracion-actual").innerText = `Aceleración modificada`;
        } catch (error) {
            console.error("Error al modificar la aceleración variable:", error);
        }
    }

    actualizarTipoMovimiento();
}

function actualizarTipoMovimiento() {
    let tipoMovimiento = "";

    if (Math.abs(aceleracionActual) < 0.01 && tipoAceleracionSeleccionada === "constante") 
        tipoMovimiento = "Movimiento Rectilíneo Uniforme (MRU)";
    else if (tipoAceleracionSeleccionada === "constante" && Math.abs(aceleracionActual) >= 0.01) 
        tipoMovimiento = "Movimiento Rectilíneo Uniformemente Acelerado (MRUA)";
    else if (tipoAceleracionSeleccionada === "variable") 
        tipoMovimiento = "Movimiento con Aceleración Variable";
    
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

    const botones = document.querySelectorAll('.toggle-buttons button');
    if (dataset.hidden) 
        botones[index].classList.add('inactive');
    else
        botones[index].classList.remove('inactive');
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
            <p>Where Δt = ${(datosTiempo[1] - datosTiempo[0]).toFixed(1)} seconds</p>
        </div>
    `;

    document.getElementById("seccion-integrales").style.display = "block";
}

function calcularIntegralTrapecio(tiempos, valores) {
    if (tiempos.length !== valores.length || tiempos.length < 2)
        return 0;

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

    if (tipoAceleracionSeleccionada === "constante")
        calcularIntegralAnaliticaConstante(tipoFuncion, resultados);
    else 
        calcularIntegralAnaliticaVariable(tipoFuncion, resultados);
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
            integral = velocidadInicial * tiempoFinal + 0.5 * aceleracion * Math.pow(tiempoFinal, 2);
            formula = `Integral(v(t)dt) = ${velocidadInicial}t + 0.5 * ${aceleracion} * t²`;
            unidades = "m";
            descripcion = "Desplazamiento total";
            break;
        case "aceleracion":
            integral = aceleracion * tiempoFinal;
            formula = `Integral(a(t)dt) = ${aceleracion} * t`;
            unidades = "m/s";
            descripcion = "Cambio total de velocidad";
            break;
        case "posicion":
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
            <p><strong>Fórmula:</strong> $${formula}$</p>
            <p><strong>Evaluada en [0, ${tiempoFinal.toFixed(2)}]:</strong> ${integral.toFixed(4)} ${unidades}</p>
            <p><strong>Interpretación física:</strong> ${descripcion}</p>
        </div>
    `;

    document.getElementById("seccion-integrales").style.display = "block";
}

function calcularIntegralAnaliticaVariable(tipoFuncion, elementoResultados) {
    const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
    const velocidadInicial = parseFloat(document.getElementById("velocidad").value);
    const tiempoFinal = datosTiempo[datosTiempo.length - 1];
    const posicionInicial = 0; // Asumimos posición inicial 0

    const { velocityExpression, positionExpression, success } = getSymbolicIntegratedFunctions(funcionAceleracion, velocidadInicial, posicionInicial);

    let unidades = "";
    let descripcion = "";
    let expresionAnalitica = "";
    let valorEvaluado = "";

    if (success) {
        if (tipoFuncion === "velocidad") {
            try {
                const scope = { t: tiempoFinal };
                valorEvaluado = math.evaluate(velocityExpression, scope).toFixed(4);
                expresionAnalitica = velocityExpression;
                unidades = "m/s";
                descripcion = "Velocidad final analítica";
            } catch (evalError) {
                console.error("Error evaluating velocity expression:", evalError);
                valorEvaluado = "N/A";
                expresionAnalitica = velocityExpression + " (Error al evaluar)";
                unidades = "";
                descripcion = "No se pudo evaluar analíticamente";
            }
        } else if (tipoFuncion === "posicion") {
            try {
                const scope = { t: tiempoFinal };
                valorEvaluado = math.evaluate(positionExpression, scope).toFixed(4);
                expresionAnalitica = positionExpression;
                unidades = "m";
                descripcion = "Posición final analítica";
            } catch (evalError) {
                console.error("Error evaluating position expression:", evalError);
                valorEvaluado = "N/A";
                expresionAnalitica = positionExpression + " (Error al evaluar)";
                unidades = "";
                descripcion = "No se pudo evaluar analíticamente";
            }
        } else if (tipoFuncion === "aceleracion") {
            try {
                const scope = { t: tiempoFinal };
                valorEvaluado = math.evaluate(funcionAceleracion, scope).toFixed(4);
                expresionAnalitica = funcionAceleracion;
                unidades = "m/s²";
                descripcion = "Aceleración en el tiempo final";
            } catch (evalError) {
                console.error("Error evaluating acceleration expression:", evalError);
                valorEvaluado = "N/A";
                expresionAnalitica = funcionAceleracion + " (Error al evaluar)";
                unidades = "";
                descripcion = "No se pudo evaluar analíticamente";
            }
        }

        elementoResultados.innerHTML = `
            <h4>Cálculo Analítico de la Integral</h4>
            <div class="resultado-integral">
                <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
                <p><strong>Método:</strong> Integración Analítica</p>
                <p><strong>Expresión analítica:</strong> ${expresionAnalitica}</p>
                <p><strong>Evaluada en t = ${tiempoFinal.toFixed(2)} s:</strong> ${valorEvaluado} ${unidades}</p>
                <p><strong>Interpretación física:</strong> ${descripcion}</p>
            </div>
        `;
    } else {
        elementoResultados.innerHTML = `
            <h4>Cálculo Analítico de la Integral</h4>
            <div class="resultado-integral">
                <p><strong>Función integrada:</strong> ${tipoFuncion.charAt(0).toUpperCase() + tipoFuncion.slice(1)}</p>
                <p><strong>Método:</strong> Integración Analítica (Aceleración Variable)</p>
                <p><strong>Función de aceleración:</strong> a(t) = ${funcionAceleracion}</p>
                <p><strong>Nota:</strong> La integración analítica para esta función no fue posible con el sistema de álgebra simbólica simple de math.js.</p>
                <p><strong>Sugerencia:</strong> Use el método numérico (Regla del Trapecio) para obtener un resultado aproximado para la función específica ingresada.</p>
            </div>
        `;
    }

    document.getElementById("seccion-integrales").style.display = "block";
}

/**
 * Checks if a math.js node represents a constant with respect to the given variable.
 * A node is considered constant if it does not contain the specified variable.
 * @param {math.MathNode} node The node to check.
 * @param {string} variable The variable name (e.g., 't').
 * @returns {boolean} True if the node is a constant, false otherwise.
 */
function isConstant(node, variable) {
    if (node.type === 'SymbolNode') {
        return node.name !== variable;
    }
    if (node.type === 'ConstantNode') {
        return true;
    }
    if (node.args) {
        return node.args.every(arg => isConstant(arg, variable));
    }
    return false;
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

    console.log("--------------------------------------------------");
    console.log("Attempting symbolic integration for acceleration expression:", accelerationExpression);

    try {
        const nodeAceleracion = math.parse(accelerationExpression);
        console.log("  Parsed acceleration node (a(t)):", nodeAceleracion.toString());

        const integratedAcelerationNode = integrateNode(nodeAceleracion, 't', 'accel_integration'); // Añadir tag de origen
        console.log("  Integrated acceleration node:", integratedAcelerationNode ? integratedAcelerationNode.toString() : 'NULL');


        if (integratedAcelerationNode) {
            let simplifiedIntegratedAceleration = math.simplify(integratedAcelerationNode).toString();
            if (simplifiedIntegratedAceleration.trim() === '') {
                simplifiedIntegratedAceleration = '0';
            }
            console.log("  Simplified integrated acceleration:", simplifiedIntegratedAceleration);

            const velocityExpressionRaw = `${initialVelocity} + (${simplifiedIntegratedAceleration})`;
            let velocityExprNode = math.parse(velocityExpressionRaw);
            velocityExprNode = math.simplify(velocityExprNode); // Simplificar la expresión de velocidad también
            let formattedVelocityExpression = velocityExprNode.toString();

            formattedVelocityExpression = formattedVelocityExpression.replace(/unaryminus/g, '-');
            velocityExpression = formattedVelocityExpression; // Usar la versión formateada
            successVelocity = true;
            console.log("  Final velocity expression:", velocityExpression);

            console.log("  Starting integration for velocity expression:", velocityExprNode.toString());
            const integratedVelocityNode = integrateNode(velocityExprNode, 't', 'vel_integration'); // Añadir tag de origen
            console.log("  Integrated velocity node:", integratedVelocityNode ? integratedVelocityNode.toString() : 'NULL');

            if (integratedVelocityNode) {
                let simplifiedIntegratedVelocity = math.simplify(integratedVelocityNode).toString();
                if (simplifiedIntegratedVelocity.trim() === '') {
                    simplifiedIntegratedVelocity = '0';
                }
                console.log("  Simplified integrated velocity:", simplifiedIntegratedVelocity);

                const positionExpressionRaw = `${initialPosition} + (${simplifiedIntegratedVelocity})`;
                let positionExprNode = math.parse(positionExpressionRaw);
                positionExprNode = math.simplify(positionExprNode); // Simplificar la expresión de posición también
                let formattedPositionExpression = positionExprNode.toString();

                formattedPositionExpression = formattedPositionExpression.replace(/unaryminus/g, '-');
                positionExpression = formattedPositionExpression; // Usar la versión formateada
                successPosition = true;
                console.log("  Final position expression:", positionExpression);
            } else {
                console.log("  integratedVelocityNode is NULL. successPosition remains false.");
            }
        } else {
            console.log("  integratedAcelerationNode is NULL. successVelocity remains false.");
        }
    } catch (e) {
        console.error("[getSymbolicIntegratedFunctions] Error during symbolic integration process:", e);
        // Fallback a las integrales no resueltas si hay algún error
        successVelocity = false;
        successPosition = false;
    }

    console.log("Symbolic integration final success:", successVelocity && successPosition);
    console.log("--------------------------------------------------");
    return {
        velocityExpression: successVelocity ? velocityExpression : `v₀ + \\int a(t)dt`,
        positionExpression: successPosition ? positionExpression : `x₀ + \\int v(t)dt`,
        success: successVelocity && successPosition // Solo éxito si ambas integraciones fueron analíticas
    };
}

/**
 * Intenta integrar un nodo de math.js. Función auxiliar para getSymbolicIntegratedFunctions.
 * Implementa reglas básicas de integración para polinomios, senos, cosenos, exponenciales.
 * @param {math.MathNode} node El nodo de la expresión a integrar.
 * @param {string} variable La variable de integración (e.g., 't').
 * @param {string} [context=''] Contexto para logging (e.g., 'accel_integration', 'vel_integration')
 * @returns {math.MathNode | null} El nodo de la integral o null si no se puede integrar.
 */
function integrateNode(node, variable, context = '') {
    if (node.type === 'ConstantNode') {
        if (node.value === 0) {
            return new math.ConstantNode(0);
        }
        return new math.OperatorNode('*', 'multiply', [new math.ConstantNode(node.value), new math.SymbolNode(variable)]);
    } else if (node.type === 'SymbolNode' && node.name === variable) {
        return new math.OperatorNode('*', 'multiply', [
            new math.OperatorNode('/', 'divide', [new math.ConstantNode(1), new math.ConstantNode(2)]),
            new math.OperatorNode('^', 'pow', [new math.SymbolNode(variable), new math.ConstantNode(2)])
        ]);
    } else if (node.type === 'OperatorNode' && node.op === '^' && node.args[0] && node.args[0].type === 'SymbolNode' && node.args[0].name === variable && node.args[1] && node.args[1].type === 'ConstantNode') {
        const power = node.args[1].value;
        const newPower = power + 1;
        const coefficient = new math.Fraction(1, newPower);
        return new math.OperatorNode('*', 'multiply', [
            new math.ConstantNode(coefficient.valueOf()),
            new math.OperatorNode('^', 'pow', [new math.SymbolNode(variable), new math.ConstantNode(newPower)])
        ]);
    } else if (node.type === 'OperatorNode') {
        if (node.op === '*' && node.args.length === 2) {
            let constantPart = null;
            let functionPart = null;

            if (isConstant(node.args[0], variable)) {
                constantPart = node.args[0];
                functionPart = node.args[1];
            } else if (isConstant(node.args[1], variable)) {
                constantPart = node.args[1];
                functionPart = node.args[0];
            }

            if (constantPart && functionPart) {
                const integratedFunctionPart = integrateNode(functionPart, variable, context + '_mul_func');
                if (integratedFunctionPart) {
                    const result = new math.OperatorNode('*', 'multiply', [constantPart, integratedFunctionPart]);
                    return result;
                }
            }
            return null; // Fallback si no se encontró constante-función o la función no se pudo integrar
        } else if (node.op === '+' || node.op === '-') {
            const integratedArgs = node.args.map(arg => integrateNode(arg, variable, context + '_sum_arg'));
            if (integratedArgs.every(arg => arg !== null)) {
                let newNode = integratedArgs[0];
                for (let i = 1; i < integratedArgs.length; i++) {
                    newNode = new math.OperatorNode(node.op, node.op === '+' ? 'add' : 'subtract', [newNode, integratedArgs[i]]);
                }
                return newNode;
            } else {
                return null;
            }
        } else if (node.op === 'unaryminus') {
            const integratedArg = integrateNode(node.args[0], variable, context + '_uminus_arg');
            if (integratedArg) {
                const result = new math.OperatorNode('unaryminus', 'unaryminus', [integratedArg]);
                return result;
            } else {
                return null;
            }
        }
        else if (node.op === '/' && node.args.length === 2) {

            if (isConstant(node.args[0], variable)) {
                return null; // Por ahora, ya no aguanto
            }
            else if (isConstant(node.args[1], variable)) {
                const constantDivisor = node.args[1];
                const functionNumerator = node.args[0];

                const invertedConstant = new math.OperatorNode('/', 'divide', [new math.ConstantNode(1), constantDivisor]);
                const multiplicationNode = new math.OperatorNode('*', 'multiply', [functionNumerator, invertedConstant]);
                
                const result = integrateNode(multiplicationNode, variable, context + '_div_to_mul');
                return result;
            }
            return null;
        }

    } else if (node.type === 'FunctionNode') {
        if (node.name === 'sin' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            return new math.OperatorNode('unaryminus', 'unaryminus', [new math.FunctionNode('cos', [new math.SymbolNode(variable)])]);
        } else if (node.name === 'cos' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            return new math.FunctionNode('sin', [new math.SymbolNode(variable)]);
        } else if (node.name === 'exp' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            return new math.FunctionNode('exp', [new math.SymbolNode(variable)]);
        } else if (node.name === 'log' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            return math.parse(`t * log(t) - t`);
        } else if (node.name === 'log10' && node.args.length === 1 && node.args[0].type === 'SymbolNode' && node.args[0].name === variable) {
            return math.parse(`t * log10(t) - t / log(10)`);
        }
    }

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
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniforme (MRU):</h3>
                <p><strong>Ecuación de posición:</strong> x(t) = x₀ + v₀t</p>
                <p><strong>Reemplazando:</strong> x(t) = ${posicionInicial} + ${velocidadInicial} * t</p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ (constante)</p>
                <p><strong>Valor:</strong> v = ${velocidadInicial} m/s</p>

                <p><strong>Ecuación de aceleración:</strong> a(t) = 0 m/s² (sin aceleración)</p>
            `;
        } else {
            ecuacionesTexto = `
                <h3>Movimiento Rectilíneo Uniformemente Acelerado (MRUA):</h3>
                <p><strong>Ecuación de posición:</strong> x(t) = x₀ + v₀t + 0.5 * a * t²</p>
                <p><strong>Reemplazando:</strong> x(t) = ${posicionInicial} + ${velocidadInicial} * t + 0.5 * ${aceleracion} * t²</p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>

                <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ + a * t</p>
                <p><strong>Reemplazando:</strong> v(t) = ${velocidadInicial} + ${aceleracion} * t</p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)} m/s</p>

                <p><strong>Ecuación de aceleración:</strong> a(t) = ${aceleracion} m/s² (constante)</p>
            `;
        }
    } else {
        const funcionAceleracion = document.getElementById("funcion-aceleracion").value;
        const { velocityExpression, positionExpression, success } = getSymbolicIntegratedFunctions(funcionAceleracion, velocidadInicial, posicionInicial);

        ecuacionesTexto = `
            <h3>Movimiento con Aceleración Variable:</h3>
            <p><strong>Función de aceleración ingresada:</strong> a(t) = ${funcionAceleracion}</p>
        `;

        if (success) {
            const displayVelocityExpression = velocityExpression.replace(/v_0/g, 'v₀').replace(/x_0/g, 'x₀');
            const displayPositionExpression = positionExpression.replace(/v_0/g, 'v₀').replace(/x_0/g, 'x₀');

            ecuacionesTexto += `
                <p><strong>Ecuación de velocidad:</strong> v(t) = ${displayVelocityExpression}</p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> v(${tiempoFinal.toFixed(2)}) = ${velocidadFinal.toFixed(2)} m/s</p>
                <p><strong>Ecuación de posición:</strong> x(t) = ${displayPositionExpression}</p>
                <p><strong>Para t = ${tiempoFinal.toFixed(2)} s:</strong> x(${tiempoFinal.toFixed(2)}) = ${posicionActual.toFixed(2)} m</p>
                <p><em>Estas ecuaciones se han derivado analíticamente.</em></p>
            `;
        } else {
            ecuacionesTexto += `
                <p><strong>Ecuación de velocidad:</strong> v(t) = v₀ + \\int a(t)dt</p>
                <p><strong>Velocidad inicial:</strong> v₀ = ${velocidadInicial} m/s</p>
                <p><strong>Velocidad final calculada (numéricamente):</strong> v = ${velocidadFinal.toFixed(2)} m/s</p>

                <p><strong>Ecuación de posición:</strong> x(t) = x₀ + \\int v(t)dt</p>
                <p><strong>Posición final calculada (numéricamente):</strong> x = ${posicionActual.toFixed(2)} m</p>
                <p><em>Para funciones de aceleración variables complejas (o cuando no se puede integrar con \`math.js\`), las ecuaciones analíticas de velocidad y posición exactas requieren un software de álgebra simbólica avanzado. La simulación calcula estos valores numéricamente.</em></p>
            `;
        }
    }

    ecuacionesTexto += `
        <h3>Método de cálculo numérico utilizado en la simulación:</h3>
        <p>Para el cálculo de la posición y velocidad con aceleración variable (o constante en la simulación paso a paso), se utilizó el método de integración numérica por aproximación de Euler:</p>
        <p>\\text{Para cada paso de tiempo } \\Delta t = 0.1s:</p>
        <p>v(t + \\Delta t) = v(t) + a(t) \\cdot \\Delta t</p>
        <p>x(t + \\Delta t) = x(t) + v(t) \\cdot \\Delta t</p>

        <h3>Resumen de la simulación:</h3>
        <p><strong>Tiempo total:</strong> ${tiempoFinal.toFixed(2)} s</p>
        <p><strong>Distancia recorrida:</strong> ${posicionActual.toFixed(2)} m</p>
        <p><strong>Velocidad inicial:</strong> ${velocidadInicial} m/s</p>
        <p><strong>Velocidad final:</strong> ${velocidadFinal.toFixed(2)} m/s</p>
    `;

    document.getElementById("ecuaciones-texto").innerHTML = ecuacionesTexto;

    if (window.MathJax) {
        window.MathJax.typesetPromise().then(() => {
        }).catch((err) => console.error('MathJax typesetting failed:', err));
    }
}

function reiniciarSimulacion() {
    clearInterval(intervalo);
    enSimulacion = false;
    document.getElementById("btn-iniciar").disabled = false;
    document.getElementById("controles-tiempo-real").style.display = "none";

    document.getElementById("auto").style.left = "0px";
    document.getElementById("tiempo").innerText = "0.0";
    document.getElementById("posicion").innerText = "0.0";
    document.getElementById("velocidadActual").innerText = "0.0";
    document.getElementById("aceleracionActual").innerText = "0.0";
    document.getElementById("tipoMovimiento").innerText = "-";

    aceleracionActual = parseFloat(document.getElementById("aceleracion").value);
    document.getElementById("aceleracion-actual").innerText = `Aceleración: ${aceleracionActual.toFixed(1)} m/s²`;

    if (chart) chart.destroy();
    chart = null;

    document.getElementById("ecuaciones-texto").innerHTML = "";

    tiempoActual = 0;
    velocidadActual = 0;
    posicionActual = 0;
    datosTiempo = [];
    datosVelocidad = [];
    datosPosicion = [];
    datosAceleracion = [];

    document.getElementById("valores-dinamicos").style.display = "block";

    document.getElementById("estadisticas").style.display = "none";

    velocidadMaxima = 0;
    aceleracionMaxima = 0;
    sumaVelocidades = 0;
    sumaAceleraciones = 0;
    contadorMuestras = 0;
}

function calcularYMostrarEstadisticas() {
    const velocidadMedia = contadorMuestras > 0 ? sumaVelocidades / contadorMuestras : 0;
    const aceleracionMedia = contadorMuestras > 0 ? sumaAceleraciones / contadorMuestras : 0;

    document.getElementById("velocidadMedia").innerText = velocidadMedia.toFixed(2);
    document.getElementById("aceleracionMedia").innerText = aceleracionMedia.toFixed(2);
    document.getElementById("tiempoTotal").innerText = tiempoActual.toFixed(2);
    document.getElementById("distanciaRecorrida").innerText = posicionActual.toFixed(2);
    document.getElementById("velocidadMaxima").innerText = velocidadMaxima.toFixed(2);
    document.getElementById("aceleracionMaxima").innerText = aceleracionMaxima.toFixed(2);

    const tipoMovimientoActual = document.getElementById("tipoMovimiento").innerText;
    const tipoMovimientoEstadisticas = document.querySelector("#estadisticas #tipoMovimiento");
    if (tipoMovimientoEstadisticas) {
        tipoMovimientoEstadisticas.innerText = tipoMovimientoActual;
    }

    document.getElementById("estadisticas").style.display = "block";
}

window.onload = function () {
    cambiarTipoAceleracion();

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    document.head.appendChild(script);
};