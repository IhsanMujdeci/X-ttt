import React, {Component} from 'react'

export default class SetGameType extends Component {

	constructor (props) {
		super(props)

		this.state = {
			selectDifficulty: false,
		}
	}

	render () {
		return (
			<div id='SetGameType'>

				<h1>Choose game type</h1>

				{!this.state.selectDifficulty && <div>
					<button type='submit' onClick={this.selTypeLive.bind(this)} className='button long'><span>Live against another player <span className='fa fa-caret-right'></span></span></button>

					&nbsp;&nbsp;&nbsp;&nbsp;

					<button type='submit' onClick={this.selTypeCompDifficulty.bind(this)} className='button long'><span>Against a computer <span className='fa fa-caret-right'></span></span></button>
				</div>}

				{this.state.selectDifficulty && <div>
					<button type='submit' onClick={()=>{this.selTypeComp('easy')}} className='button long'><span>Easy <span className='fa fa-caret-right'></span></span></button>

					&nbsp;&nbsp;&nbsp;&nbsp;

					<button type='submit' onClick={()=>{this.selTypeComp('medium')}} className='button long'><span>Medium <span className='fa fa-caret-right'></span></span></button>
					<button type='submit' onClick={()=>{this.selTypeComp('hard')}} className='button long'><span>Hard <span className='fa fa-caret-right'></span></span></button>
				</div>}


			</div>
		)
	}

	selTypeLive () {
		this.props.onSetType('live')
	}

	selTypeCompDifficulty(){
		this.setState({selectDifficulty: true})
	}
	selTypeComp (difficulty) {
		this.props.onSetType('comp', difficulty)
	}

}
