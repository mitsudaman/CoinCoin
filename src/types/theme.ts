export interface GameTheme {
  stage: 1 | 2 | 3 | 4
  name: string
  coinThreshold: number
  backgroundClass: string
  coinClass: string
  panelClass: string
}

export const UI_THEMES: GameTheme[] = [
  {
    stage: 1,
    name: '駆け出し期',
    coinThreshold: 0,
    backgroundClass: 'bg-stage-1',
    coinClass: 'coin-basic',
    panelClass: 'panel-basic'
  },
  {
    stage: 2, 
    name: '発展期',
    // coinThreshold: 100,
    coinThreshold: 5,
    backgroundClass: 'bg-stage-2',
    coinClass: 'coin-industrial', 
    panelClass: 'panel-industrial'
  },
  {
    stage: 3,
    name: '繁栄期', 
    coinThreshold: 10,
    // coinThreshold: 1000,
    backgroundClass: 'bg-stage-3',
    coinClass: 'coin-prosperity',
    panelClass: 'panel-prosperity'
  },
  {
    stage: 4,
    name: '帝国期',
    // coinThreshold: 10000,
    coinThreshold: 20,
    backgroundClass: 'bg-stage-4',
    coinClass: 'coin-imperial',
    panelClass: 'panel-imperial'
  }
]