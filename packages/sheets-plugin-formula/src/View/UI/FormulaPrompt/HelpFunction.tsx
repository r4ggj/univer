import { Component } from '@univerjs/base-ui';
import { FormulaParamType, FormulaType } from '../../../Basic';
import styles from './index.module.less';

interface IProps {
    funName: any;
    paramIndex: number;
}

interface IState {
    activeIndex: number;
    functionInfo: FormulaType;
    helpFormulaActive: boolean;
    position: {
        left: number;
        top: number;
    };
}

export class HelpFunction extends Component<IProps, IState> {
    initialize() {
        this.state = {
            activeIndex: 0,
            functionInfo: {},
            helpFormulaActive: false,
            position: {
                left: 0,
                top: 0,
            },
        };
    }

    componentWillMount() {}

    componentDidMount() {}

    updateState(helpFormulaActive: boolean, activeIndex: number = 0, functionInfo: FormulaType = {}, position = { left: 0, top: 0 }) {
        this.setState({
            helpFormulaActive,
            functionInfo,
            activeIndex,
            position,
        });
    }

    getState() {
        return this.state;
    }

    render(props: IProps, state: IState) {
        const { activeIndex, functionInfo, helpFormulaActive, position } = state;

        return (
            <div
                className={styles.helpFunction}
                style={{ display: helpFormulaActive ? 'block' : 'none', position: 'absolute', left: `${position.left}px`, top: `${position.top}px` }}
            >
                <div class={styles.helpFunctionTitle}>
                    <Help title={functionInfo.n} value={functionInfo.p} type="name" active={activeIndex} />
                </div>
                <div className={styles.helpFunctionContent}>
                    <div>{this.getLocale('formula.formulaMore.helpExample')}</div>
                    <Help title={functionInfo.n} value={functionInfo.p} type="example" active={activeIndex} />
                    <Params title={this.getLocale('formula.formulaMore.helpAbstract')} value={this.getLocale(functionInfo.d)} />
                    <>
                        {functionInfo &&
                            functionInfo.p &&
                            functionInfo.p.map((item: FormulaParamType, i: number) => (
                                <Params
                                    className={activeIndex === i ? styles.helpFunctionActive : ''}
                                    title={this.getLocale(item.name)}
                                    value={this.getLocale(item.detail)}
                                    active={activeIndex}
                                />
                            ))}
                    </>
                </div>
            </div>
        );
    }
}

interface IParamsProps {
    className?: string;
    title?: string;
    value?: string;
    active?: number;
}

interface IParamsState {}

const Params = (props: IParamsProps) => (
    <div className={`${styles.helpFunctionContentParams} ${props.className}`}>
        <div className={styles.helpFunctionContentTitle}>{props.title}</div>
        <div className={styles.helpFunctionContentDetail}>{props.value}</div>
    </div>
);

interface IHelpProps {
    title?: string;
    value?: FormulaParamType[];
    type: string;
    active: number;
}

interface IHelpState {}

class Help extends Component<IHelpProps, IHelpState> {
    render(props: IHelpProps, state: IHelpState) {
        return (
            <div>
                <span>
                    {props.title}
                    {'('}
                </span>
                {props.value &&
                    props.value.map((item: FormulaParamType, i: number) => (
                        <span className={props.active === i ? styles.helpFunctionActive : ''}>{this.getLocale(item[`${props.type}`])},</span>
                    ))}
                <span>{')'}</span>
            </div>
        );
    }
}
