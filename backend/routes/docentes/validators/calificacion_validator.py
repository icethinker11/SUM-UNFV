class CalificacionValidator:
    
    @staticmethod
    def validar_nota(nota):
        """Valida que la nota esté entre 0 y 20"""
        try:
            nota_float = float(nota)
            if not (0 <= nota_float <= 20):
                return False, 'La nota debe estar entre 0 y 20'
            return True, None
        except (ValueError, TypeError):
            return False, 'La nota debe ser un número válido'
    
    @staticmethod
    def validar_periodo(periodo):
        """Valida que el periodo sea válido"""
        periodos_validos = ['parcial1', 'parcial2', 'final']
        if periodo not in periodos_validos:
            return False, f'Periodo inválido. Debe ser uno de: {", ".join(periodos_validos)}'
        return True, None
    
    @staticmethod
    def validar_campos_requeridos(data):
        """Valida que todos los campos requeridos estén presentes"""
        campos_requeridos = ['estudiante_id', 'curso_id', 'nota', 'periodo']
        campos_faltantes = [campo for campo in campos_requeridos if campo not in data]
        
        if campos_faltantes:
            return False, f'Faltan campos requeridos: {", ".join(campos_faltantes)}'
        return True, None
    
    @staticmethod
    def validar_permisos_curso(docente, curso):
        """Valida que el docente tenga permisos para el curso"""
        if not curso or curso not in docente.cursos_docente:
            return False, 'No tienes permisos para este curso'
        return True, None
    
    @staticmethod
    def validar_estudiante_matriculado(estudiante_id, curso_id):
        """Valida que el estudiante esté matriculado en el curso"""
        from admin.models import Matricula
        
        matricula = Matricula.query.filter_by(
            estudiante_id=estudiante_id,
            curso_id=curso_id
        ).first()
        
        if not matricula:
            return False, 'El estudiante no está matriculado en este curso'
        return True, None