# 🚀 Simulador y Calculadora de Movimiento Rectilíneo

Este proyecto web interactivo ofrece un **Simulador de Movimiento Rectilíneo** y una **Calculadora de Ecuaciones** para explorar y comprender los conceptos fundamentales de la cinemática. Permite visualizar el movimiento de un objeto, experimentar con diferentes tipos de aceleración y obtener las ecuaciones de movimiento a partir de una función de velocidad dada.

---

### ✨ Características Principales

#### Simulador de Movimiento Rectilíneo (`index.html`)

* **Tipos de Aceleración:** Soporta movimiento con aceleración constante o variable (definida por una función del tiempo `a(t)`).
* **Animación Interactiva:** Visualización del movimiento de un "auto" en tiempo real sobre una pista.
* **Gráficos Dinámicos:** Muestra gráficos de velocidad, posición y aceleración vs. tiempo, actualizándose en tiempo real.
* **Control en Tiempo Real:** Permite ajustar la aceleración durante la simulación.
* **Estadísticas Detalladas:** Al finalizar la simulación, proporciona datos como velocidad media, aceleración media, tiempo total, distancia recorrida, y valores máximos.
* **Cálculo de Integrales:** Ofrece la posibilidad de calcular integrales (desplazamiento total, cambio de velocidad) tanto numéricamente (Regla del Trapecio) como analíticamente para ciertas funciones.

#### Calculadora de Ecuaciones de Movimiento (`calculadora.html`)

* **Derivación e Integración Simbólica:** A partir de una ecuación de velocidad `v(t)` ingresada, calcula y muestra simbólicamente las ecuaciones de aceleración `a(t)` (derivando) y posición `x(t)` (integrando).
* **Soporte de Funciones:** Permite el uso de polinomios, funciones trigonométricas, exponenciales y logarítmicas en las ecuaciones.

---

### 🛠 Tecnologías Utilizadas

* **HTML5:** Estructura de las páginas web.
* **CSS3:** Estilos y diseño responsivo (`styles.css`).
* **JavaScript:** Lógica del simulador (`script.js`) y la calculadora (`calculadoraScript.js`).
* **Chart.js:** Para la generación de gráficos interactivos en el simulador.
* **Math.js:** Biblioteca para el manejo de expresiones matemáticas, derivación e integración simbólica, y evaluación de funciones.
* **MathJax:** Para la renderización de ecuaciones matemáticas en formato LaTeX en la calculadora.

---

### 🚀 Cómo Usar y Ejecutar

1.  **Clonar el Repositorio:**
    ```bash
    git clone [https://github.com/judyLinguini/Fisica-Parcial-2025.git](https://github.com/judyLinguini/Fisica-Parcial-2025.git)
    cd Fisica-Parcial-2025
    ```

2.  **Abrir en el Navegador:**
    * Para el **Simulador**: Abre el archivo `index.html` directamente en tu navegador web preferido.
    * Para la **Calculadora de Ecuaciones**: Abre el archivo `calculadora.html` directamente en tu navegador web.
    * Una vez te encuentres en cualquiera de las dos puedes navegar de una a otra a través del navbar.

---

### 📂 Estructura del Proyecto

* `index.html`: Página principal del simulador de movimiento.
* `calculadora.html`: Página de la calculadora de ecuaciones.
* `script.js`: Lógica JavaScript del simulador, manejo de la animación, gráficos y cálculos.
* `calculadoraScript.js`: Lógica JavaScript para la derivación e integración de ecuaciones.
* `styles.css`: Hoja de estilos para ambas páginas.

---

### ⚠️ Consideraciones Importantes y Limitaciones

* **Funciones de Aceleración Variables:**
    * Las funciones trigonométricas e hiperbólicas se procesan numéricamente, pero el simulador no puede derivar sus ecuaciones de velocidad y posición analíticamente.
    * Funciones logarítmicas (`log(t)`, `log10(t)`) pueden producir valores irrisorios o `NaN` (Not a Number) cuando `t` se acerca o es igual a `0`.
    * Funciones con restricciones de dominio (ej. `sqrt(t)` para `t < 0`) o división por cero (ej. `1/t`) pueden generar `NaN` o `Infinity`, deteniendo la simulación o produciendo resultados erróneos.
* **Integración Simbólica:** La integración analítica está limitada a funciones y combinaciones simples (polinomios, senos, cosenos, exponenciales, logaritmos simples). Funciones más complejas (ej. `t*sin(t)`) solo mostrarán resultados numéricos.

---

### 🤝 Contribución

Si deseas contribuir a este proyecto, ¡eres bienvenido/a! Puedes abrir "issues" para reportar errores o sugerir mejoras, o enviar "pull requests" con tus contribuciones. Este es un proyecto escolar así que todo cambio será más que bienrecibido.

---

### 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.

---

### 📧 Contacto

Si tienes alguna pregunta o sugerencia, no dudes en contactarme:
* [JudyLinguini](https://github.com/judyLinguini)

---
