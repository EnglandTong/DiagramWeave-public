(function (global) {
  'use strict';

  function geometryRect(pinX, pinY, w, h) {
    const left = pinX - w / 2;
    const bottom = pinY - h / 2;
    const right = pinX + w / 2;
    const top = pinY + h / 2;
    return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="2"><Cell N="X" V="${right}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="3"><Cell N="X" V="${right}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="4"><Cell N="X" V="${left}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="5"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row></Section>`;
  }

  function connectionPoints(pinX, pinY, w, h) {
    const left = pinX - w / 2;
    const bottom = pinY - h / 2;
    const right = pinX + w / 2;
    const top = pinY + h / 2;
    const midX = pinX;
    const midY = pinY;
    return `<Section N="Connection" IX="0"><Cell N="X" V="${left}"/><Cell N="Y" V="${midY}"/><Cell N="DirX" V="-1"/><Cell N="DirY" V="0"/></Section><Section N="Connection" IX="1"><Cell N="X" V="${midX}"/><Cell N="Y" V="${top}"/><Cell N="DirX" V="0"/><Cell N="DirY" V="1"/></Section><Section N="Connection" IX="2"><Cell N="X" V="${right}"/><Cell N="Y" V="${midY}"/><Cell N="DirX" V="1"/><Cell N="DirY" V="0"/></Section><Section N="Connection" IX="3"><Cell N="X" V="${midX}"/><Cell N="Y" V="${bottom}"/><Cell N="DirX" V="0"/><Cell N="DirY" V="-1"/></Section>`;
  }

  function masterGeometryRect(w, h) {
    return geometryRect(w / 2, h / 2, w, h);
  }

  function masterLineGeometry(w, h) {
    return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" V="0"/><Cell N="Y" V="${h / 2}"/></Row><Row T="LineTo" IX="2"><Cell N="X" V="${w}"/><Cell N="Y" V="${h / 2}"/></Row></Section>`;
  }

  global.DiagramWeaveVsdxGeometry = { geometryRect, connectionPoints, masterGeometryRect, masterLineGeometry };
})(typeof window !== 'undefined' ? window : globalThis);