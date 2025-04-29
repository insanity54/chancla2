# Chancla2

The final push to version 0.0.0

## Checklist

  * [x] Weapons
  * [x] Spawnpoints
  * [x] Towers
  * [x] Dropship
  * [x] Mission editor
    * [x] walk task
    * [x] kill task
    * [ ] wait task
    * [ ] emote task
    * [ ] sfx task
  * [x] NPC fires back
  * [ ] Roller grenades
  * [x] VO lines
  * [x] Jumpjet


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


## Thanks script

Thank you for playing my game, Kybertrike version zero. Version one is planned for October 1, 2025, and I need your help! Making a great game takes thousands of hours, and in that time, I've got plenty of bills to pay. Please consider becoming a patron. The money will help me focus on building the great features that a Cyberstrike2 spiritual successor deserves.

The focus of version 1 is to implement multiplayer, so we can have throwback frag-fests with friends!

Patrons will receive exclusive in-game perks.

gte $2.50, name displayed in in-game credits
gte $25, limited edition kyberpod skin (gold)
gte $50, limited edition kyberpod skin (rainbow)
gte $100, get a NPC named after you

All tiers include perks from each previous tier.