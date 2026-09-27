// Dev only (?cursor): one target per cursor state, to check them before the real UI exists.
const style = document.createElement('style');
style.textContent = `
  .cursor-harness {
    position: fixed;
    inset: auto var(--gutter) var(--gutter);
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1px;
    background: var(--hairline);
  }
  .cursor-harness > * {
    display: grid;
    place-items: center;
    height: 120px;
    background: var(--bg);
    color: var(--dim);
    font-size: var(--fs-hud);
    letter-spacing: 0.14em;
    text-decoration: none;
    text-transform: uppercase;
  }
`;
document.head.append(style);

const harness = document.createElement('div');
harness.className = 'cursor-harness';
harness.innerHTML = `
  <a href="#/">Link: filled</a>
  <button type="button">Button: filled</button>
  <span data-cursor="pill">Pill</span>
  <span data-cursor="small">Small</span>
  <span data-cursor="word" data-cursor-words="Drag,Click">Word</span>
  <span data-cursor="prev">Prev</span>
  <span data-cursor="next">Next</span>
  <span data-cursor="close">Close</span>
  <span data-cursor="xray">X-ray</span>
  <span data-cursor="hide">Hide</span>`;
document.body.append(harness);
