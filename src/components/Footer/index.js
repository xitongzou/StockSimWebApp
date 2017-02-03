import React, { PropTypes, Component } from 'react';
import classnames from 'classnames';

import './style.css';

export default class Footer extends Component {

    render() {
        const { className, ...props } = this.props;
        return (
            <div className={classnames('Footer', className)} {...props}>
                <h6>
                    &copy; 2017 Tong Zou
                </h6>
            </div>
        );
    }
}