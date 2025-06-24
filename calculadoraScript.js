/**
 * Función principal para calcular y mostrar las ecuaciones de aceleración y posición
 * a partir de una ecuación de velocidad ingresada por el usuario.
 */
function calcularEcuacionesDesdeVelocidad() {
    const ecuacionVelocidadStr = document.getElementById('ecuacionVelocidad').value;
    const posicionInicial = parseFloat(document.getElementById('posicionInicial').value);

    const resultadoAceleracionDiv = document.getElementById('resultadoAceleracion');
    const resultadoPosicionDiv = document.getElementById('resultadoPosicion');

    // Limpiar resultados anteriores
    resultadoAceleracionDiv.innerText = '';
    resultadoPosicionDiv.innerText = '';

    try {
        // 1. Parsear la ecuación de velocidad
        const velocityNode = math.parse(ecuacionVelocidadStr);
        const scope = { t: null }; // Definir 't' como variable para math.js

        // 2. Calcular la ecuación de Aceleración (derivada de la velocidad)
        // a(t) = dv/dt
        const accelerationNode = math.derivative(velocityNode, 't');
        
        // Define un handler para toTex que evite la recursión infinita
        // El handler debe devolver una cadena para los nodos que maneja, y undefined para los que no.
        const customToTexHandler = function (node, options) {
            // Personaliza la salida de toTex para que sea más legible en algunos casos
            // Por ejemplo, para evitar t^1 y mostrar solo t
            if (node.type === 'OperatorNode' && node.op === '^' && node.args[1].isConstantNode && node.args[1].value === '1') {
                return node.args[0].toTex(options.handler); // Llama toTex del sub-nodo con el mismo handler
            }
            // Si el handler no maneja este nodo, debe devolver undefined para que math.js use su lógica predeterminada
            return undefined; 
        };

        const accelerationTex = accelerationNode.toTex({ handler: customToTexHandler });

        // Mostrar la ecuación de aceleración
        resultadoAceleracionDiv.innerHTML = `\\( a(t) = ${accelerationTex} \\)`;

        // 3. Calcular la ecuación de Posición (integral de la velocidad)
        // x(t) = integral(v(t)dt) + x0
        const positionNode = integrateNode(velocityNode, 't');

        // Sumar la posición inicial como constante de integración
        let finalPositionNode;
        if (posicionInicial !== 0) {
            // Convertimos la posición inicial a un ConstantNode antes de sumar
            finalPositionNode = math.add(positionNode, math.parse(String(posicionInicial)));
        } else {
            finalPositionNode = positionNode;
        }

        const positionTex = finalPositionNode.toTex({ handler: customToTexHandler }); // Usa el mismo handler
        
        // Mostrar la ecuación de posición
        resultadoPosicionDiv.innerHTML = `\\( x(t) = ${positionTex} \\)`;

        // Renderizar las ecuaciones con MathJax
        MathJax.typeset();

    } catch (error) {
        resultadoAceleracionDiv.innerHTML = `<p style="color: red;">Error al procesar la ecuación de velocidad: ${error.message}</p>`;
        resultadoPosicionDiv.innerHTML = '';
        console.error("Error en calcularEcuacionesDesdeVelocidad:", error);
    }
}

/**
 * Función para integrar simbólicamente un nodo de expresión de math.js.
 * @param {math.MathNode} node - El nodo a integrar.
 * @param {string} variable - La variable con respecto a la cual integrar (ej. 't').
 * @returns {math.MathNode} El nodo de la expresión integrada.
*/
function integrateNode(node, variable) {
    console.log(`[integrateNode] Procesando nodo: ${node.toString()} (Tipo: ${node.type})`);

    // Implementación básica de reglas de integración para math.js nodes
    // NOTA: La integración simbólica es compleja. Esta función maneja casos comunes (polinomios, senos, cosenos, exponenciales).
    // No manejará todos los casos (ej. integrales por partes, reglas de cadena complejas).

    if (node.type === 'ConstantNode') {
        // Integral de una constante C es C*variable
        console.log(`[integrateNode-ConstantNode] Integrando constante: ${node.toString()}`);
        return math.parse(`${node.toString()} * ${variable}`);
    } else if (node.type === 'SymbolNode' && node.name === variable) {
        // Integral de 't' es t^2 / 2
        console.log(`[integrateNode-SymbolNode] Integrando variable: ${node.toString()} como t^2 / 2`);
        return math.parse(`${variable}^2 / 2`);
    } else if (node.type === 'OperatorNode') {
        console.log(`[integrateNode-OperatorNode] Procesando operador: ${node.op}`);
        if (node.op === '+') {
            // Integral de (A + B) es integral(A) + integral(B)
            const integratedLeft = integrateNode(node.args[0], variable);
            const integratedRight = integrateNode(node.args[1], variable);
            console.log(`[integrateNode-OperatorNode-+] Sumando integrales: (${integratedLeft.toString()}) + (${integratedRight.toString()})`);
            // Forzar a math.js a parsear la combinación para evitar problemas de tipo
            return math.parse(`(${integratedLeft.toString()}) + (${integratedRight.toString()})`);
        } else if (node.op === '-') {
            // Integral de (A - B) es integral(A) - integral(B)
            const integratedLeft = integrateNode(node.args[0], variable);
            const integratedRight = integrateNode(node.args[1], variable);
            console.log(`[integrateNode-OperatorNode--] Restando integrales: (${integratedLeft.toString()}) - (${integratedRight.toString()})`);
            // Forzar a math.js a parsear la combinación para evitar problemas de tipo
            return math.parse(`(${integratedLeft.toString()}) - (${integratedRight.toString()})`);
        } else if (node.op === '*') {
            // Integral de C*f(t) es C*integral(f(t))
            const [arg1, arg2] = node.args;
            console.log(`[integrateNode-OperatorNode-*] Arg1: ${arg1.toString()} (Tipo: ${arg1.type}), Arg2: ${arg2.toString()} (Tipo: ${arg2.type})`);
            if (arg1.isConstantNode) {
                const integratedArg2 = integrateNode(arg2, variable);
                console.log(`[integrateNode-OperatorNode-*] Multiplicando constante (${arg1.toString()}) por integral de (${integratedArg2.toString()})`);
                return math.parse(`${arg1.toString()} * (${integratedArg2.toString()})`);
            } else if (arg2.isConstantNode) {
                const integratedArg1 = integrateNode(arg1, variable);
                console.log(`[integrateNode-OperatorNode-*] Multiplicando integral de (${integratedArg1.toString()}) por constante (${arg2.toString()})`);
                return math.parse(`(${integratedArg1.toString()}) * ${arg2.toString()}`);
            } else {
                // Caso más complejo como t*sin(t) - no se maneja directamente con reglas simples
                console.log(`[integrateNode-OperatorNode-*] No se pudo integrar: ${node.toString()}`);
                return math.parse(`integral(${node.toString()})`); // Representación simbólica no calculada
            }
        } else if (node.op === '^') {
            // Integral de t^n es t^(n+1) / (n+1)
            const [base, exponent] = node.args;
            console.log(`[integrateNode-OperatorNode-^] Base: ${base.toString()} (Tipo: ${base.type}), Exponente: ${exponent.toString()} (Tipo: ${exponent.type})`);
            if (base.type === 'SymbolNode' && base.name === variable && exponent.type === 'ConstantNode') {
                const n = parseFloat(exponent.value);
                if (n === -1) {
                    console.log(`[integrateNode-OperatorNode-^] Integrando 1/t`);
                    return math.parse(`log(abs(${variable}))`);
                } else {
                    const newExponentValue = n + 1;
                    console.log(`[integrateNode-OperatorNode-^] Integrando t^n`);
                    const newExponentNode = new math.ConstantNode(newExponentValue);
                    
                    const powerNode = math.parse(`${base.toString()}^${newExponentNode.toString()}`);
                    const denominatorNode = new math.ConstantNode(newExponentValue);
                    
                    return math.parse(`(${powerNode.toString()}) / (${denominatorNode.toString()})`);
                }
            } else {
                console.log(`[integrateNode-OperatorNode-^] No se pudo integrar: ${node.toString()}`);
                return math.parse(`integral(${node.toString()})`);
            }
        }
    } else if (node.type === 'FunctionNode') {
        const funcName = node.name;
        const arg = node.args[0]; // Asumimos un solo argumento para funciones simples como sin(t)
        console.log(`[integrateNode-FunctionNode] Procesando función: ${funcName}, Arg: ${arg.toString()} (Tipo: ${arg.type})`);

        if (arg.type === 'SymbolNode' && arg.name === variable) {
            switch (funcName) {
                case 'sin':
                    console.log(`[integrateNode-FunctionNode-sin] Integrando sin(t)`);
                    return math.unaryMinus(math.cos(arg)); // math.js handles these directly
                case 'cos':
                    console.log(`[integrateNode-FunctionNode-cos] Integrando cos(t)`);
                    return math.sin(arg); // math.js handles these directly
                case 'exp':
                    console.log(`[integrateNode-FunctionNode-exp] Integrando exp(t)`);
                    return math.exp(arg); // math.js handles these directly
                case 'log': // Asumimos logaritmo natural
                case 'ln':
                    console.log(`[integrateNode-FunctionNode-log] Integrando log(t) (no implementado directamente)`);
                    return math.parse(`integral(log(abs(${variable})))`); // Dejar como forma no integrada
                case 'sqrt':
                    console.log(`[integrateNode-FunctionNode-sqrt] Integrando sqrt(t)`);
                    const tNode = new math.SymbolNode(variable);
                    const exponent1_5Node = new math.ConstantNode(1.5);
                    
                    const powerNode = math.parse(`${tNode.toString()}^${exponent1_5Node.toString()}`);
                    const denominator1_5Node = new math.ConstantNode(1.5);
                    
                    return math.parse(`(${powerNode.toString()}) / (${denominator1_5Node.toString()})`);
                default:
                    console.log(`[integrateNode-FunctionNode] No se pudo integrar función desconocida: ${node.toString()}`);
                    return math.parse(`integral(${node.toString()})`); // Representación simbólica no calculada
            }
        } else if (arg.type === 'OperatorNode' && arg.op === '*' && arg.args[0].type === 'ConstantNode' && arg.args[1].type === 'SymbolNode' && arg.args[1].name === variable) {
            // Manejo de funciones con argumento como C*t, ej. sin(2*t)
            const C = parseFloat(arg.args[0].value);
            console.log(`[integrateNode-FunctionNode-C*t] Integrando función con argumento C*t. C: ${C}`);
            const argStr = arg.toString(); // Esto representaría "C*t"
            
            switch (funcName) {
                case 'sin':
                    // Integral de sin(C*t) es -cos(C*t) / C
                    return math.parse(`-cos(${argStr}) / ${C}`);
                case 'cos':
                    // Integral de cos(C*t) es sin(C*t) / C
                    return math.parse(`sin(${argStr}) / ${C}`);
                case 'exp':
                    // Integral de exp(C*t) es exp(C*t) / C
                    return math.parse(`exp(${argStr}) / ${C}`);
                default:
                    console.log(`[integrateNode-FunctionNode-C*t] No se pudo integrar función desconocida: ${node.toString()}`);
                    return math.parse(`integral(${node.toString()})`);
            }
        } else {
            console.log(`[integrateNode-FunctionNode] No se pudo integrar por argumento complejo: ${node.toString()}`);
            return math.parse(`integral(${node.toString()})`);
        }
    }

    // Para cualquier otro tipo de nodo o caso no manejado, devolver una representación simbólica de la integral
    console.log(`[integrateNode] No se pudo integrar nodo no manejado: ${node.toString()}`);
    return math.parse(`integral(${node.toString()})`);
}

// Asegurarse de que MathJax.typeset() se llama después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', (event) => {
    // Si ya hay una ecuación de velocidad predefinida, calcularla al cargar la página
    const ecuacionVelocidadInput = document.getElementById('ecuacionVelocidad');
    if (ecuacionVelocidadInput && ecuacionVelocidadInput.value) {
        calcularEcuacionesDesdeVelocidad();
    }
});