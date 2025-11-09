import React, { useState, useEffect } from "react";

function ModalSeccion({ isOpen, onClose, onSave, seccionData, initialState }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (seccionData) setFormData(seccionData);
    else setFormData(initialState);
  }, [seccionData, initialState]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Limpia el error del campo si el usuario empieza a corregirlo
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🔍 Validación personalizada para el campo "periodo"
  const validateForm = () => {
    const newErrors = {};
    const periodoRegex = /^(20\d{2})-(I|II)$/; // Años 2000–2099 y "I" o "II"

    if (!formData.codigo) newErrors.codigo = "Seleccione un código.";
    if (!formData.ciclo_academico)
      newErrors.ciclo_academico = "Seleccione un ciclo académico.";
    if (!formData.periodo) newErrors.periodo = "Ingrese el periodo.";
    else if (!periodoRegex.test(formData.periodo))
      newErrors.periodo = "Formato inválido. Ejemplo: 2025-I o 2025-II.";

    if (!formData.estado) newErrors.estado = "Seleccione un estado.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Encabezado */}
        <div className="modal-header">Nueva sección</div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Código:</label>
            <select
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            {errors.codigo && <p className="error-text">{errors.codigo}</p>}
          </div>

          <div className="form-group">
            <label>Ciclo Académico:</label>
            <select
              name="ciclo_academico"
              value={formData.ciclo_academico}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              {[
                "I",
                "II",
                "III",
                "IV",
                "V",
                "VI",
                "VII",
                "VIII",
                "IX",
                "X",
              ].map((ciclo) => (
                <option key={ciclo} value={ciclo}>
                  {ciclo}
                </option>
              ))}
            </select>
            {errors.ciclo_academico && (
              <p className="error-text">{errors.ciclo_academico}</p>
            )}
          </div>

          <div className="form-group">
            <label>Periodo:</label>
            <input
              type="text"
              name="periodo"
              value={formData.periodo}
              onChange={handleChange}
              placeholder="Ejemplo: 2025-I"
              required
              pattern="^(20\d{2})-(I|II)$"
              title="Formato válido: 2025-I o 2025-II"
            />
            {errors.periodo && <p className="error-text">{errors.periodo}</p>}
          </div>

          <div className="form-group">
            <label>Estado:</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
            {errors.estado && <p className="error-text">{errors.estado}</p>}
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              💾 Guardar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              ✖ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalSeccion;