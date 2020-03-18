import React from 'react';

class Customizer extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
    }
    componentDidMount() {
        window.addEventListener("load", this.defaultSettings);
    }

    toggle() {
        document.getElementById("customizer").classList.toggle("show-service-panel");
    }
    render() {
        return (
            <aside className="customizer" id="customizer">
                {/*--------------------------------------------------------------------------------*/}
                {/* Toggle Customizer From Here                                                    */}
                {/*--------------------------------------------------------------------------------*/}
                <span className="service-panel-toggle text-white" onClick={this.toggle}><i className="fa fa-spin fa-cog"></i></span>
                <div className="customizer-body pt-3">
                    <div className="border-bottom px-3">
                        {/*--------------------------------------------------------------------------------*/}
                        {/* Change Layout Settings from Here[Dark, Fixed Header && Sidebar], Boxed Layout  */}
                        {/*--------------------------------------------------------------------------------*/}
                        <h5 className="font-medium mt-1 mb-3">Layout Settings</h5>
                        <div className="custom-control custom-checkbox my-2">
                            <input type="checkbox" className="custom-control-input" name="theme-view" id="theme-view" onClick={this.props.darkTheme} />
                            <label className="custom-control-label" htmlFor="theme-view">Dark Theme</label>
                        </div>
                        <div className="custom-control custom-checkbox my-2">
                            <input type="checkbox" className="custom-control-input" name="sidebar-position" id="sidebar-position" onClick={this.props.sidebarPosition} />
                            <label className="custom-control-label" htmlFor="sidebar-position">Fixed Sidebar</label>
                        </div>
                        <div className="custom-control custom-checkbox my-2">
                            <input type="checkbox" className="custom-control-input" name="header-position" id="header-position" onClick={this.props.headerPosition} />
                            <label className="custom-control-label" htmlFor="header-position">Fixed Header</label>
                        </div>
{/*                         <div className="custom-control custom-checkbox my-2">
                            <input type="checkbox" className="custom-control-input" name="boxed-layout" id="boxed-layout" onClick={this.props.boxedTheme} />
                            <label className="custom-control-label" htmlFor="boxed-layout">Boxed Layout</label>
                        </div>
                        <div className="custom-control custom-checkbox my-2">
                            <input type="checkbox" className="custom-control-input" name="rtl" id="rtl" onClick={this.props.rtl} />
                            <label className="custom-control-label" htmlFor="rtl">RTL</label>
                        </div> */}
                    </div>
                    <div className="mt-3 border-bottom px-3">
                        {/*--------------------------------------------------------------------------------*/}
                        {/* Change LOGO Background                                                         */}
                        {/*--------------------------------------------------------------------------------*/}
                        <h5 className="font-medium mt-1 mb-3">Logo Backgrounds</h5>
                        <ul className="theme-color mb-2">
                            <li className="theme-item"><span className="theme-link" data-logobg="skin1" onClick={this.props.logobgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-logobg="skin2" onClick={this.props.logobgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-logobg="skin3" onClick={this.props.logobgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-logobg="skin4" onClick={this.props.logobgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-logobg="skin5" onClick={this.props.logobgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-logobg="skin6" onClick={this.props.logobgChange}>&nbsp;</span></li>
                        </ul>

                    </div>
                    <div className="mt-3 border-bottom px-3">
                        {/*--------------------------------------------------------------------------------*/}
                        {/* Change NAVBAR Background                                                       */}
                        {/*--------------------------------------------------------------------------------*/}
                        <h5 className="font-medium mt-1 mb-3">Navbar Backgrounds</h5>
                        <ul className="theme-color mb-2">
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin1" onClick={this.props.navbarbgChange}>&nbsp;&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin2" onClick={this.props.navbarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin3" onClick={this.props.navbarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin4" onClick={this.props.navbarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin5" onClick={this.props.navbarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-navbarbg="skin6" onClick={this.props.navbarbgChange}>&nbsp;</span></li>
                        </ul>

                    </div>
                    <div className="mt-3 border-bottom px-3">
                        {/*--------------------------------------------------------------------------------*/}
                        {/* Change SIDEBAR Background                                                      */}
                        {/*--------------------------------------------------------------------------------*/}
                        <h5 className="font-medium mt-1 mb-3">Sidebar Backgrounds</h5>
                        <ul className="theme-color mb-2">
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin1" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin2" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin3" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin4" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin5" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                            <li className="theme-item"><span className="theme-link" data-sidebarbg="skin6" onClick={this.props.sidebarbgChange}>&nbsp;</span></li>
                        </ul>

                    </div>
                </div>
            </aside>
        );
    }
}
export default Customizer;
