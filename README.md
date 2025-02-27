# Chancla2

The final push to version 0.0.0

## Checklist

  * [x] Weapons
  * [x] Spawnpoints
  * [x] Towers
  * [x] Dropship
  * [ ] Mission editor
    * [ ] walk task
    * [ ] kill task
    * [ ] wait task
    * [ ] emote task
    * [ ] sfx task
  * [ ] NPC fires back
  * [ ] Roller grenades
  * [ ] VO lines
  * [ ] Jumpjet


## Dropship voice lines

  * [ ] "I copy you"

## Known issues

If two towers spawn with overlapping collision meshes, it triggers recursive rapier calls that will crash the game.

## TaskList Component

TaskList gives us the ability to create procedural NPC behaviors right within Rogue Engine editor.

### Example

```csv
wait,trigger3
walk,60,0,30
walk,60,0,35
emote,dance,3
sfx,prepare-to-die.mp3
kill,player
```
