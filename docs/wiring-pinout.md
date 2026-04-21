# Raspberry Pi Zero 2 W Wiring Pinout

Use **BCM GPIO numbering** in the Python script.

## Components
- 1x Momentary push button
- 1x Sound sensor module (digital output pin `DO`)
- 1x Heartbeat sensor module (digital pulse output)
- Jumper wires
- Optional 10k resistor for button pull-down when using external resistor setup

## Wiring Map

| Sensor Pin | Raspberry Pi Zero 2 W Pin | BCM GPIO | Notes |
|---|---|---|---|
| Push button leg 1 | Physical pin 11 | GPIO17 | Configured as input with internal pull-up |
| Push button leg 2 | Physical pin 6 | GND | Active-low press detection |
| Sound sensor `DO` | Physical pin 13 | GPIO27 | Digital trigger output |
| Sound sensor `VCC` | Physical pin 1 | 3.3V | Do not use 5V for GPIO-level safety |
| Sound sensor `GND` | Physical pin 9 | GND | Shared ground |
| Heartbeat sensor signal | Physical pin 15 | GPIO22 | Digital pulse output |
| Heartbeat sensor `VCC` | Physical pin 17 | 3.3V | Check module voltage support |
| Heartbeat sensor `GND` | Physical pin 14 | GND | Shared ground |

## Electrical Notes
- Keep all sensor outputs at **3.3V logic**. If your sensor outputs 5V, add a level shifter before GPIO input.
- Share a common ground between all modules and the Pi.
- For long wires, use twisted pair or shielded leads to reduce noise.
- Tune the sound sensor onboard potentiometer to avoid constant triggering.
