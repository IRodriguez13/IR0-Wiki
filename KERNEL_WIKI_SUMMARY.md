# IR0 Kernel - Resumen Detallado para Wiki

## Información General del Kernel

**Nombre:** IR0 Kernel  
**Versión:** 0.0.1 pre-release 1  
**Arquitectura:** x86-64 (soporte experimental para ARM32)  
**Tipo:** Kernel Monolítico  
**Licencia:** GNU General Public License v3.0  
**Autor:** Iván Rodriguez  

---

## 📋 Tabla de Contenidos

1. [Características del Kernel](#características-del-kernel)
2. [Arquitectura y Componentes](#arquitectura-y-componentes)
3. [Sistema de Archivos](#sistema-de-archivos)
4. [Gestión de Procesos](#gestión-de-procesos)
5. [Llamadas al Sistema (Syscalls)](#llamadas-al-sistema-syscalls)
6. [Comandos del Shell](#comandos-del-shell)
7. [Comandos del Makefile](#comandos-del-makefile)
8. [Drivers y Hardware](#drivers-y-hardware)
9. [Sistema de Memoria](#sistema-de-memoria)
10. [Sistema de Interrupciones](#sistema-de-interrupciones)

---

## Características del Kernel

### Capacidades Principales

- ✅ **Modo Protegido x86-64** con separación Ring 0 (kernel) / Ring 3 (usuario)
- ✅ **Sistema de Archivos MINIX** con soporte completo de VFS
- ✅ **Gestión de Procesos** con múltiples estados y scheduler Round-Robin
- ✅ **Llamadas al Sistema POSIX-compatible**
- ✅ **Shell Interactivo** con más de 30 comandos integrados
- ✅ **Gestión de Memoria** con paginación, heap allocator (kmalloc/kfree)
- ✅ **Drivers de Hardware** (PS/2, ATA, VGA, Audio, Timers)
- ✅ **Sistema de Interrupciones** completo (IDT, PIC, TSS)
- ✅ **Soporte Multiboot** para arranque con GRUB
- ✅ **Formato Binario ELF64**

### Objetivos de Compilación

El kernel soporta tres targets de compilación:
- **Desktop:** Funcionalidad completa con filesystem
- **Server:** Optimizado para servidores con filesystem
- **IoT:** Configuración ligera con filesystem
- **Embedded:** Configuración mínima sin filesystem

---

## Arquitectura y Componentes

### Estructura del Proyecto

```
ir0-kernel/
├── arch/              # Código específico de arquitectura (x86-64, ARM)
│   ├── x86-64/        # Implementación x86-64
│   │   ├── sources/   # GDT, IDT, TSS, user mode, fault handlers
│   │   ├── asm/       # Boot, syscall entry points
│   │   └── linker.ld  # Script de enlazado
│   └── common/        # Interfaz común entre arquitecturas
├── kernel/            # Núcleo del kernel
│   ├── main.c         # Punto de entrada (kmain)
│   ├── init.c         # Inicialización del sistema
│   ├── process.c      # Gestión de procesos
│   ├── syscalls.c     # Implementación de syscalls
│   ├── shell.c        # Shell interactivo
│   ├── elf_loader.c   # Cargador de binarios ELF
│   └── scheduler/     # Algoritmos de scheduling
├── fs/                # Sistema de archivos
│   ├── vfs.c          # Virtual File System
│   ├── minix_fs.c     # Driver MINIX filesystem
│   ├── ramfs.c        # RAM filesystem
│   └── path.c         # Utilidades de rutas
├── drivers/           # Controladores de hardware
│   ├── IO/            # PS/2 keyboard, mouse
│   ├── storage/       # ATA/IDE disk driver
│   ├── video/         # VGA, typewriter effect
│   ├── timer/         # PIT, HPET, LAPIC, RTC
│   ├── audio/         # Sound Blaster 16
│   ├── serial/        # Puerto serial (debug)
│   └── dma/           # DMA controller
├── interrupt/         # Sistema de interrupciones
│   └── arch/          # IDT, PIC, ISR handlers
├── includes/          # Headers del kernel
│   └── ir0/           # Headers principales
│       ├── memory/    # Gestión de memoria
│       ├── syscall.h  # Definiciones de syscalls
│       └── ...
├── userspace/         # Programas de espacio de usuario
│   ├── libc/          # Biblioteca C básica
│   └── bin/           # Binarios (echo, etc.)
└── setup/             # Configuración del kernel
```

### Subsistemas Principales

1. **Kernel Core** (`kernel/`)
   - Inicialización del sistema
   - Gestión de procesos y tareas
   - Scheduler Round-Robin
   - Shell interactivo
   - Cargador ELF

2. **Filesystem** (`fs/`)
   - VFS (Virtual File System)
   - MINIX filesystem driver
   - RAM filesystem
   - Gestión de permisos (chmod)

3. **Memory Management** (`includes/ir0/memory/`)
   - Paginación con identity mapping
   - Heap allocator (kmalloc/kfree)
   - Bitmap de memoria física
   - Separación kernel/user space

4. **Interrupts** (`interrupt/`)
   - IDT (Interrupt Descriptor Table)
   - PIC (Programmable Interrupt Controller)
   - ISR handlers
   - Exception handling

5. **Drivers** (`drivers/`)
   - PS/2 keyboard y mouse
   - ATA/IDE storage
   - VGA display
   - Timers (PIT, HPET, LAPIC, RTC)
   - Sound Blaster 16 audio
   - Serial port

---

## Sistema de Archivos

### Virtual File System (VFS)

El kernel implementa una capa de abstracción VFS que permite:
- Montaje de múltiples sistemas de archivos
- Operaciones unificadas (open, read, write, close)
- Gestión de puntos de montaje
- Soporte para diferentes tipos de FS

### MINIX Filesystem

**Características:**
- Sistema de archivos completo con inodos
- Soporte de directorios y archivos regulares
- Permisos UNIX (rwxrwxrwx)
- Operaciones soportadas:
  - `ls` - Listar directorios
  - `cat` - Leer archivos
  - `mkdir` - Crear directorios
  - `rmdir` - Eliminar directorios
  - `rm` - Eliminar archivos
  - `touch` - Crear archivos vacíos
  - `chmod` - Cambiar permisos
  - `stat` - Información de archivos

### RAM Filesystem

- Sistema de archivos en memoria
- Usado para archivos de arranque
- Rápido acceso sin I/O de disco

### Operaciones de Archivo Soportadas

| Operación | Syscall | Descripción |
|-----------|---------|-------------|
| `open` | `SYS_OPEN` | Abrir archivo y obtener descriptor |
| `close` | `SYS_CLOSE` | Cerrar descriptor de archivo |
| `read` | `SYS_READ` | Leer datos de archivo |
| `write` | `SYS_WRITE` | Escribir datos a archivo |
| `lseek` | `SYS_LSEEK` | Mover puntero de archivo |
| `stat` | `SYS_STAT` | Obtener información de archivo |
| `fstat` | `SYS_FSTAT` | Stat usando descriptor |
| `mkdir` | `SYS_MKDIR` | Crear directorio |
| `rmdir` | `SYS_RMDIR` | Eliminar directorio |
| `unlink` | `SYS_UNLINK` | Eliminar archivo |
| `chmod` | `SYS_CHMOD` | Cambiar permisos |
| `chdir` | `SYS_CHDIR` | Cambiar directorio actual |
| `getcwd` | `SYS_GETCWD` | Obtener directorio actual |
| `mount` | `SYS_MOUNT` | Montar filesystem |

---

## Gestión de Procesos

### Estados de Proceso

El kernel soporta los siguientes estados:
- `PROCESS_NEW` - Proceso recién creado
- `PROCESS_READY` - Listo para ejecutar
- `PROCESS_RUNNING` - En ejecución
- `PROCESS_BLOCKED` - Bloqueado (I/O, etc.)
- `PROCESS_SLEEPING` - Durmiendo
- `PROCESS_STOPPED` - Detenido
- `PROCESS_ZOMBIE` - Terminado, esperando recolección
- `PROCESS_DEAD` - Completamente terminado

### Scheduler

**Tipo:** Round-Robin (RR)
- Quantum de tiempo configurable
- Cambio de contexto completo
- Soporte para múltiples procesos
- Integración con timer (PIT)

**Otros schedulers disponibles:**
- CFS (Completely Fair Scheduler) - En desarrollo
- Priority-based scheduler - En desarrollo

### Syscalls de Procesos

| Syscall | Número | Descripción |
|---------|--------|-------------|
| `fork` | 12 | Crear proceso hijo |
| `exec` | 56 | Ejecutar binario |
| `exit` | 0 | Terminar proceso |
| `waitpid` | 13 | Esperar por proceso hijo |
| `getpid` | 3 | Obtener PID actual |
| `getppid` | 4 | Obtener PID del padre |
| `ps` | 7 | Listar procesos |

---

## Llamadas al Sistema (Syscalls)

### Lista Completa de Syscalls

El kernel IR0 implementa **más de 40 syscalls** compatibles con POSIX:

#### Gestión de Procesos
```c
SYS_EXIT      = 0   // Terminar proceso
SYS_FORK      = 12  // Crear proceso hijo
SYS_EXEC      = 56  // Ejecutar binario
SYS_WAITPID   = 13  // Esperar proceso hijo
SYS_GETPID    = 3   // Obtener PID
SYS_GETPPID   = 4   // Obtener PID padre
SYS_PS        = 7   // Listar procesos
```

#### I/O y Archivos
```c
SYS_READ      = 2   // Leer de descriptor
SYS_WRITE     = 1   // Escribir a descriptor
SYS_OPEN      = 59  // Abrir archivo
SYS_CLOSE     = 60  // Cerrar archivo
SYS_LSEEK     = 19  // Mover puntero
SYS_DUP2      = 63  // Duplicar descriptor
```

#### Sistema de Archivos
```c
SYS_LS            = 5   // Listar directorio
SYS_LS_DETAILED   = 61  // Listar con detalles
SYS_CAT           = 9   // Mostrar contenido
SYS_MKDIR         = 6   // Crear directorio
SYS_RMDIR         = 40  // Eliminar directorio
SYS_RMDIR_R       = 88  // Eliminar recursivo
SYS_RM            = 11  // Eliminar archivo
SYS_UNLINK        = 87  // Desvincular archivo
SYS_TOUCH         = 10  // Crear/actualizar archivo
SYS_READ_FILE     = 14  // Leer archivo completo
SYS_WRITE_FILE    = 8   // Escribir archivo completo
SYS_CREAT         = 62  // Crear archivo
SYS_STAT          = 58  // Info de archivo
SYS_FSTAT         = 57  // Info por descriptor
SYS_CHMOD         = 100 // Cambiar permisos
SYS_CHDIR         = 80  // Cambiar directorio
SYS_GETCWD        = 79  // Obtener directorio actual
SYS_MOUNT         = 90  // Montar filesystem
```

#### Gestión de Memoria
```c
SYS_BRK       = 51  // Cambiar tamaño heap
SYS_SBRK      = 52  // Incrementar heap
SYS_MMAP      = 53  // Mapear memoria
SYS_MUNMAP    = 54  // Desmapear memoria
SYS_MPROTECT  = 55  // Proteger memoria
```

#### Información del Sistema
```c
SYS_DF        = 95  // Espacio en disco
SYS_WHOAMI    = 94  // Usuario actual
```

### Interfaz de Syscalls

Las syscalls se invocan mediante la interrupción `int 0x80` con los siguientes registros:
- `RAX`: Número de syscall
- `RBX`: Argumento 1
- `RCX`: Argumento 2
- `RDX`: Argumento 3
- `RSI`: Argumento 4
- `RDI`: Argumento 5

**Valor de retorno:** `RAX` (int64_t)

---

## Comandos del Shell

El shell IR0 incluye **más de 30 comandos integrados**:

### Comandos de Navegación y Archivos

| Comando | Sintaxis | Descripción |
|---------|----------|-------------|
| `ls` | `ls [-l] [DIR]` | Listar contenido de directorio |
| `cd` | `cd [DIR]` | Cambiar directorio actual |
| `pwd` | `pwd` | Mostrar directorio actual |
| `cat` | `cat FILE` | Mostrar contenido de archivo |
| `mkdir` | `mkdir DIR` | Crear directorio |
| `rmdir` | `rmdir DIR` | Eliminar directorio vacío |
| `rm` | `rm [-r] FILE` | Eliminar archivo o directorio |
| `touch` | `touch FILE` | Crear archivo vacío o actualizar timestamp |
| `cp` | `cp SRC DST` | Copiar archivo |
| `mv` | `mv SRC DST` | Mover/renombrar archivo |

### Comandos de Edición

| Comando | Sintaxis | Descripción |
|---------|----------|-------------|
| `echo` | `echo TEXT` | Imprimir texto o escribir a archivo |
| `sed` | `sed 's/OLD/NEW/' FILE` | Sustituir texto en archivo |

**Redirección con echo:**
- `echo "texto" > archivo` - Sobrescribir archivo
- `echo "texto" >> archivo` - Agregar al final del archivo

### Comandos del Sistema

| Comando | Sintaxis | Descripción |
|---------|----------|-------------|
| `ps` | `ps` | Listar procesos en ejecución |
| `whoami` | `whoami` | Mostrar usuario actual |
| `df` | `df` | Mostrar espacio en disco |
| `lsblk` | `lsblk` | Listar dispositivos de bloque |
| `mount` | `mount DEV MOUNTPOINT [fstype]` | Montar filesystem |
| `chmod` | `chmod MODE PATH` | Cambiar permisos de archivo |
| `chown` | `chown USER PATH` | Cambiar propietario (no implementado) |

### Comandos de Ejecución

| Comando | Sintaxis | Descripción |
|---------|----------|-------------|
| `exec` | `exec FILE` | Ejecutar binario ELF |
| `exit` | `exit` | Salir del shell |

### Comandos de Utilidad

| Comando | Sintaxis | Descripción |
|---------|----------|-------------|
| `help` | `help` | Mostrar ayuda de comandos |
| `clear` | `clear` | Limpiar pantalla |
| `type` | `type [mode]` | Control de efecto typewriter |
| `ln` | `ln` | Crear enlace (no soportado) |

### Efecto Typewriter

El comando `type` controla el efecto de máquina de escribir:
- `type fast` - Velocidad rápida
- `type normal` - Velocidad normal
- `type slow` - Velocidad lenta
- `type off` - Desactivar efecto
- `type` - Mostrar modo actual

---

## Comandos del Makefile

### Comandos de Compilación

| Comando | Descripción |
|---------|-------------|
| `make ir0` | Compilación completa: kernel ISO + programas userspace |
| `make kernel-x64.bin` | Compilar solo el binario del kernel |
| `make kernel-x64.iso` | Crear imagen ISO booteable |
| `make userspace-programs` | Compilar solo programas de userspace |
| `make clean` | Limpiar todos los artefactos de compilación |
| `make userspace-clean` | Limpiar solo programas userspace |

### Comandos de Ejecución en QEMU

| Comando | Descripción |
|---------|-------------|
| `make run` | Ejecutar con GUI + disco virtual (recomendado) |
| `make run-debug` | Ejecutar con GUI + salida de debug serial |
| `make debug` | Ejecutar con logging detallado de QEMU |
| `make run-nodisk` | Ejecutar sin disco virtual |
| `make run-console` | Ejecutar en modo consola (sin GUI) |

**Configuración QEMU:**
- Memoria: 512MB
- Display: GTK (configurable a SDL2)
- Serial: stdio (para debug)
- Flags: `-no-reboot -no-shutdown`
- Debug log: `qemu_debug.log`

### Comandos de Disco Virtual

| Comando | Descripción |
|---------|-------------|
| `make create-disk` | Crear imagen de disco virtual (disk.img) |
| `make delete-disk` | Eliminar imagen de disco virtual |

**Especificaciones del disco:**
- Tamaño: 100MB (configurable)
- Formato: RAW
- Filesystem: MINIX
- Script: `scripts/create_disk.sh`

### Comandos de Utilidades

| Comando | Descripción |
|---------|-------------|
| `make deptest` | Verificar todas las dependencias del sistema |
| `make help` | Mostrar ayuda completa del Makefile |
| `make menuconfig` | Lanzar configuración del kernel (ncurses) |
| `make unibuild FILE=<archivo>` | Compilar archivo individual |
| `make unibuild-clean FILE=<archivo>` | Limpiar archivo compilado individual |

**Ejemplo de unibuild:**
```bash
make unibuild FILE=fs/ramfs.c
make unibuild FILES="fs/ramfs.c fs/vfs.c"
```

### Comandos de Windows

| Comando | Descripción |
|---------|-------------|
| `make windows` o `make win` | Compilar para Windows (MSYS2/MinGW) |
| `make windows-clean` | Limpiar artefactos de Windows |

### Targets Phony

Todos los comandos principales son `.PHONY` targets:
```makefile
.PHONY: all clean run run-nodisk run-console debug create-disk 
        help userspace-programs userspace-clean unibuild 
        unibuild-clean ir0 windows win windows-clean 
        win-clean deptest menuconfig
```

---

## Drivers y Hardware

### Drivers de Entrada/Salida

#### PS/2 Controller
- **Keyboard Driver** (`drivers/IO/ps2.c`)
  - Soporte completo de teclado PS/2
  - Buffer de entrada
  - Traducción de scancodes
  - IRQ 1

- **Mouse Driver** (`drivers/IO/ps2_mouse.c`)
  - Soporte de mouse PS/2
  - Detección de movimiento y clicks
  - IRQ 12

### Drivers de Almacenamiento

#### ATA/IDE Driver (`drivers/storage/ata.c`)
- Soporte para hasta 4 discos (Primary/Secondary Master/Slave)
- Operaciones:
  - Lectura de sectores
  - Escritura de sectores
  - Identificación de discos
  - Detección de geometría
- Información del disco:
  - Modelo
  - Número de serie
  - Tamaño total
  - Tipo de filesystem

#### Partition Support (`drivers/disk/partition.c`)
- Detección de tabla de particiones MBR
- Soporte GPT (en desarrollo)
- Identificación de tipos de filesystem

### Drivers de Video

#### VGA Driver (`drivers/video/vbe.c`)
- Modo texto 80x25
- Buffer VGA en 0xB8000
- Colores de 16 bits
- Scrolling automático

#### Typewriter Effect (`drivers/video/typewriter.c`)
- Efecto de máquina de escribir para salida
- Modos: Fast, Normal, Slow, Off
- Integrado con VGA

### Drivers de Timer

#### PIT (Programmable Interval Timer) (`drivers/timer/pit/pit.c`)
- Timer principal del sistema
- Frecuencia: 1000 Hz (1ms)
- IRQ 0
- Usado para scheduling

#### RTC (Real-Time Clock) (`drivers/timer/rtc/rtc.c`)
- Reloj de tiempo real
- Fecha y hora del sistema
- IRQ 8

#### HPET (High Precision Event Timer) (`drivers/timer/hpet/hpet.c`)
- Timer de alta precisión
- Alternativa moderna al PIT
- Detección automática via ACPI

#### LAPIC (Local APIC Timer) (`drivers/timer/lapic/lapic.c`)
- Timer local del procesador
- Para sistemas multiprocesador

### Drivers de Audio

#### Sound Blaster 16 (`drivers/audio/sound_blaster.c`)
- Soporte básico de audio
- DMA para reproducción
- Inicialización automática

### Driver Serial

#### Serial Port (`drivers/serial/serial.c`)
- Puerto COM1 (0x3F8)
- Usado para debug output
- Baudrate: 115200

### DMA Controller (`drivers/dma/dma.c`)
- Controlador DMA para transferencias
- Usado por audio y otros dispositivos

---

## Sistema de Memoria

### Gestión de Memoria Virtual

#### Paging
- **Tamaño de página:** 4KB
- **Niveles:** 4 niveles (PML4, PDPT, PD, PT)
- **Identity Mapping:** Primeros 4GB mapeados 1:1
- **Separación:** Kernel space (0x0 - 0xFFFFFFFF) / User space (0x100000000+)

#### Heap Allocator
- **Funciones principales:**
  - `kmalloc(size)` - Asignar memoria del kernel
  - `kfree(ptr)` - Liberar memoria
  - `heap_init()` - Inicializar heap

- **Características:**
  - Asignación dinámica
  - Gestión de bloques libres
  - Coalescencia de bloques
  - Protección contra fragmentación

#### Physical Memory Management
- **Bitmap de memoria física**
- **Gestión de frames de 4KB**
- **Allocator de páginas físicas**

### Memory Syscalls

```c
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
int munmap(void *addr, size_t length);
int mprotect(void *addr, size_t len, int prot);
void *sbrk(intptr_t increment);
int brk(void *addr);
```

---

## Sistema de Interrupciones

### IDT (Interrupt Descriptor Table)

**Configuración:**
- 256 entradas
- Descriptores de 16 bytes (x86-64)
- Gates de tipo Interrupt y Trap

**Tipos de interrupciones:**
1. **Excepciones (0-31):**
   - Division by Zero (#DE)
   - Debug (#DB)
   - Page Fault (#PF)
   - General Protection Fault (#GP)
   - Invalid Opcode (#UD)
   - Double Fault (#DF)
   - etc.

2. **IRQs (32-47):**
   - IRQ 0: PIT Timer
   - IRQ 1: Keyboard
   - IRQ 8: RTC
   - IRQ 12: PS/2 Mouse
   - IRQ 14: Primary ATA
   - IRQ 15: Secondary ATA

3. **Syscalls (0x80):**
   - Interrupción de software para syscalls

### PIC (Programmable Interrupt Controller)

**Configuración:**
- Remapeo de IRQs: 32-47
- Master PIC: IRQs 0-7 → INT 32-39
- Slave PIC: IRQs 8-15 → INT 40-47
- EOI (End of Interrupt) automático

### ISR Handlers

**Implementación:**
- Stubs en assembly (`interrupt/arch/x86-64/isr_stubs_64.asm`)
- Handlers en C (`interrupt/arch/isr_handlers.c`)
- Preservación de contexto completo
- Stack switching para kernel/user

### TSS (Task State Segment)

**Uso:**
- Stack switching en syscalls
- Kernel stack por CPU
- Configuración en GDT

---

## Compilación y Dependencias

### Herramientas Requeridas

#### Esenciales
- **GCC** (GNU Compiler Collection) - Compilador C
- **NASM** (Netwide Assembler) - Ensamblador
- **LD** (GNU Linker) - Enlazador ELF x86-64
- **Make** - Automatización de compilación

#### Runtime
- **QEMU** (qemu-system-x86_64) - Emulador
- **GRUB** (grub-mkrescue) - Creación de ISO booteable

#### Opcionales
- **Python 3** - Sistema de configuración del kernel

### Instalación en Linux

```bash
# Debian/Ubuntu
sudo apt-get install build-essential nasm qemu-system-x86 grub-pc-bin python3

# Arch Linux
sudo pacman -S base-devel nasm qemu grub python
```

### Flags de Compilación

**CFLAGS:**
```makefile
-m64                    # Arquitectura 64-bit
-ffreestanding          # Sin biblioteca estándar
-mcmodel=large          # Modelo de memoria grande
-mno-red-zone           # Sin red zone (necesario para kernel)
-mno-mmx -mno-sse       # Sin instrucciones MMX/SSE
-nostdlib               # Sin stdlib
-fno-stack-protector    # Sin protección de stack
-fno-builtin            # Sin funciones builtin
-Wall -Wextra           # Warnings
-g                      # Símbolos de debug
```

**LDFLAGS:**
```makefile
-T kernel/linker.ld     # Script de enlazado
-z max-page-size=0x1000 # Tamaño de página 4KB
```

**NASMFLAGS:**
```makefile
-f elf64                # Formato ELF 64-bit
```

### Estructura de Compilación

1. **Compilación de objetos:**
   - Archivos C → .o con GCC
   - Archivos ASM → .o con NASM

2. **Enlazado:**
   - Todos los .o → kernel-x64.bin con LD
   - Linker script: `arch/x86-64/linker.ld`

3. **Creación de ISO:**
   - kernel-x64.bin → iso/boot/
   - grub.cfg → iso/boot/grub/
   - grub-mkrescue → kernel-x64.iso

### Objetos Compilados

**Total de módulos:** ~70 archivos objeto

**Categorías:**
- Kernel core: 8 objetos
- Memory: 3 objetos
- Libraries: 5 objetos
- Interrupts: 5 objetos
- Drivers: 15 objetos
- Filesystem: 6 objetos
- Architecture: 9 objetos
- Setup: 1 objeto

---

## Configuración del Kernel

### Sistema de Configuración (Kconfig)

El kernel usa un sistema de configuración basado en Kconfig:

```bash
make menuconfig
```

**Opciones configurables:**
- Target de compilación (Desktop/Server/IoT/Embedded)
- Drivers a incluir
- Opciones de memoria
- Debug features
- Filesystem support

### Archivos de Configuración

- `Kconfig` - Definiciones de opciones
- `.config` - Configuración actual
- `include/generated/autoconf.h` - Headers generados

---

## Debugging y Testing

### Debug Output

**Serial Port:**
```c
serial_print("Debug message\n");
serial_print_hex32(value);
```

**QEMU Debug:**
```bash
make run-debug  # Salida serial en terminal
```

**Log Files:**
- `qemu_debug.log` - Log de QEMU con guest errors, interrupts

### Testing

**Scripts de test:**
- `scripts/test.sh` - Suite de tests completa
- `scripts/test_userspace.sh` - Tests de userspace
- `scripts/quick_run.sh` - Ejecución rápida para testing

---

## Userspace

### Biblioteca C (libc)

**Ubicación:** `userspace/libc/`

**Funciones implementadas:**
- `syscalls.c` - Wrappers de syscalls
- `stdio.c` - printf, puts, etc.
- `malloc.c` - malloc, free

### Programas de Usuario

**Ubicación:** `userspace/bin/`

**Programas compilados:**
- `echo` - Comando echo standalone

**Compilación:**
```bash
make userspace-programs
```

**Ubicación de binarios:** `userspace/build/`

---

## Roadmap y Desarrollo Futuro

### Características Planeadas

- [ ] Soporte completo de ARM32/ARM64
- [ ] Networking stack (TCP/IP)
- [ ] Drivers de red (E1000, RTL8139)
- [ ] Sistema de archivos ext2/ext4
- [ ] Soporte SMP (multiprocesador)
- [ ] Scheduler CFS completo
- [ ] IPC (Inter-Process Communication)
- [ ] Signals POSIX
- [ ] Dynamic linking
- [ ] GUI básico

### Contribuciones

Ver `CONTRIBUTING.md` para guías de contribución.

---

## Recursos y Documentación

### Documentación Adicional

- `setup/docs/BUILD_SYSTEM.md` - Sistema de compilación
- `setup/docs/INSTALL.md` - Guía de instalación
- `setup/docs/CONFIGURATION_SYSTEM_README.md` - Sistema de configuración
- `setup/docs/INCLUDE_SYSTEM_GUIDE.md` - Sistema de includes

### Referencias

- [OSDev Wiki](https://wiki.osdev.org/)
- [Intel x86-64 Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [POSIX Specification](https://pubs.opengroup.org/onlinepubs/9699919799/)

---

## Licencia

Este proyecto está licenciado bajo **GNU General Public License v3.0**.

Ver archivo `LICENSE` para detalles completos.

---

## Autor

**Iván Rodriguez**  
GitHub: [@IRodriguez13](https://github.com/IRodriguez13)  
Repositorio: [Mini_kernel_SO](https://github.com/IRodriguez13/Mini_kernel_SO)

---

**Última actualización:** 2025-11-22  
**Versión del documento:** 1.0
