import os

class MaterialValidator:
    
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx'}
    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
    
    @staticmethod
    def validar_extension_archivo(filename):
        """Valida si el archivo tiene una extensión permitida"""
        if '.' not in filename:
            return False, 'El archivo debe tener una extensión'
        
        extension = filename.rsplit('.', 1)[1].lower()
        if extension not in MaterialValidator.ALLOWED_EXTENSIONS:
            return False, f'Formato de archivo no permitido. Solo se aceptan: {", ".join(MaterialValidator.ALLOWED_EXTENSIONS).upper()}'
        
        return True, None
    
    @staticmethod
    def validar_tamano_archivo(file):
        """Valida el tamaño del archivo"""
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MaterialValidator.MAX_FILE_SIZE:
            return False, f'El archivo supera el tamaño máximo de {MaterialValidator.MAX_FILE_SIZE / (1024 * 1024):.0f} MB'
        
        return True, None
    
    @staticmethod
    def validar_campos_formulario(form):
        """Valida que todos los campos del formulario estén presentes"""
        campos_requeridos = ['titulo', 'descripcion', 'curso_id', 'unidad']
        campos_faltantes = [campo for campo in campos_requeridos if campo not in form]
        
        if campos_faltantes:
            return False, f'Faltan campos requeridos: {", ".join(campos_faltantes)}'
        return True, None
    
    @staticmethod
    def validar_archivo_presente(files):
        """Valida que se haya enviado un archivo"""
        if 'archivo' not in files:
            return False, 'No se ha enviado ningún archivo'
        
        archivo = files['archivo']
        if archivo.filename == '':
            return False, 'No se ha seleccionado ningún archivo'
        
        return True, None