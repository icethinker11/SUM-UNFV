from datetime import datetime

class AsistenciaValidator:
    
    ESTADOS_VALIDOS = ['presente', 'ausente', 'tardanza']
    
    @staticmethod
    def validar_campos_requeridos(data):
        """Valida que todos los campos requeridos estén presentes"""
        campos_requeridos = ['curso_id', 'fecha_clase', 'asistencias']
        campos_faltantes = [campo for campo in campos_requeridos if campo not in data]
        
        if campos_faltantes:
            return False, f'Faltan campos requeridos: {", ".join(campos_faltantes)}'
        return True, None
    
    @staticmethod
    def validar_estado(estado):
        """Valida que el estado sea válido"""
        if estado not in AsistenciaValidator.ESTADOS_VALIDOS:
            return False, f'Estado inválido: {estado}. Debe ser uno de: {", ".join(AsistenciaValidator.ESTADOS_VALIDOS)}'
        return True, None
    
    @staticmethod
    def validar_fecha(fecha_str):
        """Valida el formato de la fecha"""
        try:
            datetime.strptime(fecha_str, '%Y-%m-%d')
            return True, None
        except ValueError:
            return False, 'Formato de fecha inválido. Debe ser YYYY-MM-DD'
    
    @staticmethod
    def validar_lista_asistencias(asistencias):
        """Valida que la lista de asistencias no esté vacía"""
        if not asistencias or len(asistencias) == 0:
            return False, 'Debe registrar al menos un estudiante'
        return True, None
    
    @staticmethod
    def validar_datos_asistencia(asist_data):
        """Valida los datos de una asistencia individual"""
        if 'estudiante_id' not in asist_data:
            return False, 'Falta el ID del estudiante'
        
        if 'estado' not in asist_data:
            return False, 'Falta el estado de asistencia'
        
        return True, None