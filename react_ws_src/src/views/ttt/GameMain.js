import React, {Component} from 'react'

import io from 'socket.io-client'

import TweenMax from 'gsap'

import rand_arr_elem from '../../helpers/rand_arr_elem'
import rand_to_fro from '../../helpers/rand_to_fro'

export default class SetName extends Component {

	constructor (props) {
		super(props)

		this.win_sets = [
			['c1', 'c2', 'c3'],
			['c4', 'c5', 'c6'],
			['c7', 'c8', 'c9'],

			['c1', 'c4', 'c7'],
			['c2', 'c5', 'c8'],
			['c3', 'c6', 'c9'],

			['c1', 'c5', 'c9'],
			['c3', 'c5', 'c7']
		]

		this.centreCell = 'c5'

		this.sides = ['c2', 'c4', 'c6', 'c8']

		this.cpu = this.easyCPU.bind(this)
		if(props.difficulty === 'medium'){
			this.cpu = this.mediumCPU.bind(this)
		}
		if(props.difficulty === 'hard'){
			this.cpu = this.hardCpu.bind(this)
		}

		if (this.props.game_type !== 'live') {
			this.state = {
				cell_vals: {c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null, c9: null},
				next_turn_ply: this.isPlayerFirst(),
				game_play: true,
				game_stat: 'Start game'
			}

		} else {
			this.sock_start()
			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: false,
				game_stat: 'Connecting'
			}
		}
	}

	isPlayerFirst(){
		const rnd = Math.random()
		return rnd <= 0.5
	}


	componentDidMount () {
    	TweenMax.from('#game_stat', 1, {display: 'none', opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeIn})
    	const handler = TweenMax.from('#game_board', 1, {display: 'none', opacity: 0, x:-200, y:-200, scaleX:0, scaleY:0, ease: Power4.easeIn})
		// If its computers turn first wait for load in animation then play computers turn 500m later
		if(this.state.next_turn_ply === false) {
			handler.eventCallback('onComplete', () => {
				setTimeout(() => {
					this.turn_comp()
				}, 500)
			});
		}

	}

	sock_start () {
		this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

		this.socket.on('connect', function(data) {
			this.socket.emit('new player', { name: app.settings.curr_user.name });
		}.bind(this));

		this.socket.on('pair_players', function(data) { 

			this.setState({
				next_turn_ply: data.mode === 'm',
				game_play: true,
				game_stat: 'Playing with ' + data.opp.name
			})

		}.bind(this));


		this.socket.on('opp_turn', this.turn_opp_live.bind(this));
	}

	componentWillUnmount () {
		this.socket && this.socket.disconnect();
	}

	cell_cont (c) {
		const { cell_vals } = this.state

		return <div>
			{cell_vals && cell_vals[c] === 'x' && <i className="fa fa-times fa-5x"/>}
			{cell_vals && cell_vals[c] === 'o' && <i className="fa fa-circle-o fa-5x"/>}
		</div>
	}


	getPlayerName(){
		if(this.props.game_type === 'comp'){
			return this.props.difficulty + ' ' + this.props.game_type
		}
		return this.props.game_type
	}

	render () {
		return (
			<div id='GameMain'>

				<h1>Play {this.getPlayerName()}</h1>

				<div id="game_stat">
					<div id="game_stat_msg">{this.state.game_stat}</div>
					{this.state.game_play && <div id="game_turn_msg">{this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}</div>}
				</div>

				<div id="game_board">
					<table>
					<tbody>
						<tr>
							<td id='game_board-c1' ref='c1' onClick={this.click_cell.bind(this)}> {this.cell_cont('c1')} </td>
							<td id='game_board-c2' ref='c2' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c2')} </td>
							<td id='game_board-c3' ref='c3' onClick={this.click_cell.bind(this)}> {this.cell_cont('c3')} </td>
						</tr>
						<tr>
							<td id='game_board-c4' ref='c4' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c4')} </td>
							<td id='game_board-c5' ref='c5' onClick={this.click_cell.bind(this)} className="vbrd hbrd"> {this.cell_cont('c5')} </td>
							<td id='game_board-c6' ref='c6' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c6')} </td>
						</tr>
						<tr>
							<td id='game_board-c7' ref='c7' onClick={this.click_cell.bind(this)}> {this.cell_cont('c7')} </td>
							<td id='game_board-c8' ref='c8' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c8')} </td>
							<td id='game_board-c9' ref='c9' onClick={this.click_cell.bind(this)}> {this.cell_cont('c9')} </td>
						</tr>
					</tbody>
					</table>
				</div>

				<button type='submit' onClick={this.end_game.bind(this)} className='button'><span>End Game <span className='fa fa-caret-right'></span></span></button>

			</div>
		)
	}

	click_cell (e) {
		if (!this.state.next_turn_ply || !this.state.game_play) return

		const cell_id = e.currentTarget.id.substr(11)
		if (this.state.cell_vals[cell_id]) return

		if (this.props.game_type !== 'live')
			this.turn_ply_comp(cell_id)
		else
			this.turn_ply_live(cell_id)
	}

	turn_ply_comp (cell_id) {
		let { cell_vals } = this.state
		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.state.cell_vals = cell_vals

		this.check_turn()
	}


	/**
	 * With programming the computer I have gone with a very straight forward approach of programming in strict logic with little optimisation
	 * There are methods where I could build a tree and use minimax approach to figure out optimal moves but this is slightly out of scope.
	 */

	// Hard coding an optimal tic tac toe approach
	// will defend perfectly and will win with 2 available branches
	// source: https://www.youtube.com/watch?v=5n2aQ3UQu9Y
	hardCpu(emptyCells){

		// offensive turn
		// pick a corner, default to c1 because it doesn't matter to strategy and makes programming easier
		if(emptyCells.length === 9){
			return 'c1'
		}
		const cell_vals = this.state.cell_vals

		// defensive turn
		// best defensive option is centre to protect from optimal attack
		// if it's taken just take c1, as it's a corner and has most wining branches.
		if(emptyCells.length === 8){
			if(cell_vals[this.centreCell]){
				return 'c1'
			}
			return this.centreCell
		}

		// offensive turn
		// pic an adjacent corner if the space in between not taken up
		// this sets up to take final corner
		if(emptyCells.length === 7){
			if(cell_vals['c2'] === null && cell_vals['c3'] === null){
				return 'c3'
			} else{
				return 'c7'
			}
		}

		// defensive turn
		// if player can win in 1 turn we defend it
		// else we cover one of the side cells to prevent optimal strategy attack
		// this forces the opponent to defend our centre cell defense
		// if we couldn't set up centre cell defence we just revert to normal mediumCPU strat
		if(emptyCells.length === 6){
			if(cell_vals[this.centreCell] !=='o'){
				return this.mediumCPU(emptyCells)
			}
			const dMove = this.findDefensiveMove()
			if(dMove){
				return dMove
			}
			for(const s of this.sides){
				if(cell_vals[s] === null){
					return s
				}
			}
		}

		// offensive turn
		// if we are under threat we defend
		// else we capture the final corner cell that will lead to victory
		if(
			emptyCells.length === 5
		) {
			const dMove = this.findDefensiveMove()
			if(dMove){
				return dMove
			}
			if(!cell_vals['c3'] && !cell_vals['c2']){
				return 'c3'
			}
			if(!cell_vals['c4'] && !cell_vals['c7']){
				return 'c7'
			}
			if(!cell_vals['c9']){
				return 'c9'
			}
			return this.mediumCPU(emptyCells)

		}

		// Subsequent turns will lead to a win or draw if simple medium cpu rules apply
		return this.mediumCPU(emptyCells)
	}

	// Medium cpu will look for
	// Winning move THEN defending against opponent winning move THEN set up for winning move for next turn
	// If none of these options are found we simply pick random using easyCPU
	mediumCPU(emptyCells){


		// if no moves have been made we just pick a random cell in easy cpu
		if(emptyCells.length === 9){
			return this.easyCPU(emptyCells)
		}

		let defensiveMove
		let oneAwayFromWinMove

		const cell_vals = this.state.cell_vals
		for(const w of this.win_sets){
			let foundXCount = 0
			let foundOCount = 0
			let emptyCell = null
			for(const s of w){
				if(cell_vals[s] === 'x'){
					foundXCount++
				}
				if(cell_vals[s] === 'o'){
					foundOCount++
				}
				if(cell_vals[s] === null){
					emptyCell = s
				}
			}
			// Shortcut to winning move
			if(foundOCount === 2 && emptyCell){
				return emptyCell
			}
			if(foundOCount === 1 && foundXCount === 0){
				oneAwayFromWinMove = emptyCell
			}
			if(foundXCount === 2 && emptyCell){
				defensiveMove = emptyCell
			}
		}

		// If no winning move fall back to defensive move
		if(defensiveMove){
			return defensiveMove
		}
		// if no defensive move set up for next move win
		if(oneAwayFromWinMove){
			return oneAwayFromWinMove
		}

		// If no moves are found we default to easy cpu
		return this.easyCPU(emptyCells)
	}

	easyCPU(emptyCells){
		return rand_arr_elem(emptyCells)
	}

	findDefensiveMove(){
		const cell_vals = this.state.cell_vals
		for(const w of this.win_sets){
			let foundXCount = 0
			let emptyCell = null
			for(const s of w){
				if(cell_vals[s] === 'x'){
					foundXCount++
				}
				if(cell_vals[s] === null){
					emptyCell = s
				}
			}
			if(foundXCount === 2 && emptyCell){
				return emptyCell
			}
		}
		return null
	}

	getEmptyCellArr(cell_vals){
		const arr = []
		for(const o in cell_vals){
			if(cell_vals[o] === null){
				arr.push(o)
			}
		}
		return arr
	}

	// Computers turn
	turn_comp () {
		let cell_vals = this.state.cell_vals
		const empty_cells_arr = this.getEmptyCellArr(cell_vals)

		const c = this.cpu(empty_cells_arr)
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})
		this.state.cell_vals = cell_vals

		this.check_turn()
	}

	turn_ply_live (cell_id) {

		let { cell_vals } = this.state
		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.socket.emit('ply_turn', { cell_id });
		this.state.cell_vals = cell_vals
		this.check_turn()
	}


	turn_opp_live (data) {
		let { cell_vals } = this.state

		const c = data.cell_id
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.state.cell_vals = cell_vals
		this.check_turn()
	}

	check_turn () {

		const { cell_vals } = this.state

		let win = false
		let set
		let fin = true

		if (this.props.game_type !== 'live')
			this.state.game_stat = 'Play'

		for (let i=0; !win && i<this.win_sets.length; i++) {
			set = this.win_sets[i]
			if (cell_vals[set[0]] && cell_vals[set[0]]==cell_vals[set[1]] && cell_vals[set[0]]==cell_vals[set[2]])
				win = true
		}

		for (let i=1; i<=9; i++) 
			!cell_vals['c'+i] && (fin = false)

		if (win) {
		
			this.refs[set[0]].classList.add('win')
			this.refs[set[1]].classList.add('win')
			this.refs[set[2]].classList.add('win')

			TweenMax.killAll(true)
			TweenMax.from('td.win', 1, {opacity: 0, ease: Linear.easeIn})

			this.setState({
				game_stat: (cell_vals[set[0]] === 'x'?'You':'Opponent')+' win',
				game_play: false
			})

			this.socket && this.socket.disconnect();

		} else if (fin) {
		
			this.setState({
				game_stat: 'Draw',
				game_play: false
			})

			this.socket && this.socket.disconnect();

		} else {
			this.props.game_type !== 'live' && this.state.next_turn_ply && setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

			this.setState({
				next_turn_ply: !this.state.next_turn_ply
			})
		}
		
	}

	end_game () {
		this.socket && this.socket.disconnect();
		this.props.onEndGame()
	}

}
