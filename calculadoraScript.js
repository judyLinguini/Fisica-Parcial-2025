/**
 * Función principal para calcular y mostrar las ecuaciones de aceleración y posición
 * a partir de una ecuación de velocidad ingresada por el usuario.
 */
function calcularEcuacionesDesdeVelocidad() {
    const ecuacionVelocidadStr = document.getElementById('ecuacionVelocidad').value;
    const posicionInicial = parseFloat(document.getElementById('posicionInicial').value);

    const resultadoAceleracionDiv = document.getElementById('resultadoAceleracion');
    const resultadoPosicionDiv = document.getElementById('resultadoPosicion');

    resultadoAceleracionDiv.innerText = '';
    resultadoPosicionDiv.innerText = '';

    try {
        const velocityNode = math.parse(ecuacionVelocidadStr);
        const scope = { t: null }; // Definir 't' como variable para math.js

        const accelerationNode = math.derivative(velocityNode, 't');
        
        const customToTexHandler = function (node, options) {
            if (node.type === 'OperatorNode' && node.op === '^' && node.args[1].isConstantNode && node.args[1].value === '1')
                return node.args[0].toTex(options.handler);

            return undefined; 
        };

        const accelerationTex = accelerationNode.toTex({ handler: customToTexHandler });

        resultadoAceleracionDiv.innerHTML = `\\( a(t) = ${accelerationTex} \\)`;

        const positionNode = integrateNode(velocityNode, 't');

        let finalPositionNode;
        if (posicionInicial !== 0)            
            finalPositionNode = math.add(positionNode, math.parse(String(posicionInicial)));
        else
            finalPositionNode = positionNode;

        const positionTex = finalPositionNode.toTex({ handler: customToTexHandler });
        
        resultadoPosicionDiv.innerHTML = `\\( x(t) = ${positionTex} \\)`;

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
        console.log(`[integrateNode-ConstantNode] Integrando constante: ${node.toString()}`);
        return math.parse(`${node.toString()} * ${variable}`);
    } else if (node.type === 'SymbolNode' && node.name === variable) {
        console.log(`[integrateNode-SymbolNode] Integrando variable: ${node.toString()} como t^2 / 2`);
        return math.parse(`${variable}^2 / 2`);
    } else if (node.type === 'OperatorNode') {
        console.log(`[integrateNode-OperatorNode] Procesando operador: ${node.op}`);
        if (node.op === '+') {
            const integratedLeft = integrateNode(node.args[0], variable);
            const integratedRight = integrateNode(node.args[1], variable);
            console.log(`[integrateNode-OperatorNode-+] Sumando integrales: (${integratedLeft.toString()}) + (${integratedRight.toString()})`);

            return math.parse(`(${integratedLeft.toString()}) + (${integratedRight.toString()})`);
        } else if (node.op === '-') {
            const integratedLeft = integrateNode(node.args[0], variable);
            const integratedRight = integrateNode(node.args[1], variable);
            console.log(`[integrateNode-OperatorNode--] Restando integrales: (${integratedLeft.toString()}) - (${integratedRight.toString()})`);

            return math.parse(`(${integratedLeft.toString()}) - (${integratedRight.toString()})`);
        } else if (node.op === '*') {

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
                console.log(`[integrateNode-OperatorNode-*] No se pudo integrar: ${node.toString()}`);
                return math.parse(`integral(${node.toString()})`);
            }
        } else if (node.op === '^') {
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
                    return math.unaryMinus(math.cos(arg)); 
                case 'cos':
                    console.log(`[integrateNode-FunctionNode-cos] Integrando cos(t)`);
                    return math.sin(arg); 
                case 'exp':
                    console.log(`[integrateNode-FunctionNode-exp] Integrando exp(t)`);
                    return math.exp(arg); 
                case 'log': 
                case 'ln':
                    console.log(`[integrateNode-FunctionNode-log] Integrando log(t) (no implementado directamente)`);
                    return math.parse(`integral(log(abs(${variable})))`); 
                case 'sqrt':
                    console.log(`[integrateNode-FunctionNode-sqrt] Integrando sqrt(t)`);
                    const tNode = new math.SymbolNode(variable);
                    const exponent1_5Node = new math.ConstantNode(1.5);
                    
                    const powerNode = math.parse(`${tNode.toString()}^${exponent1_5Node.toString()}`);
                    const denominator1_5Node = new math.ConstantNode(1.5);
                    
                    return math.parse(`(${powerNode.toString()}) / (${denominator1_5Node.toString()})`);
                default:
                    console.log(`[integrateNode-FunctionNode] No se pudo integrar función desconocida: ${node.toString()}`);
                    return math.parse(`integral(${node.toString()})`); 
            }
        } else if (arg.type === 'OperatorNode' && arg.op === '*' && arg.args[0].type === 'ConstantNode' && arg.args[1].type === 'SymbolNode' && arg.args[1].name === variable) {
            const C = parseFloat(arg.args[0].value);
            console.log(`[integrateNode-FunctionNode-C*t] Integrando función con argumento C*t. C: ${C}`);
            const argStr = arg.toString(); 
            
            switch (funcName) {
                case 'sin':
                    return math.parse(`-cos(${argStr}) / ${C}`);
                case 'cos':
                    return math.parse(`sin(${argStr}) / ${C}`);
                case 'exp':
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

    console.log(`[integrateNode] No se pudo integrar nodo no manejado: ${node.toString()}`);
    return math.parse(`integral(${node.toString()})`);
}

document.addEventListener('DOMContentLoaded', (event) => {
    const ecuacionVelocidadInput = document.getElementById('ecuacionVelocidad');
    if (ecuacionVelocidadInput && ecuacionVelocidadInput.value)
        calcularEcuacionesDesdeVelocidad();
});