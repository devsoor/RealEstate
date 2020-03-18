import React, {Component} from "react";
import PropTypes from 'prop-types';
import { Button} from "reactstrap";

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Loader from 'react-loader-advanced';

import './SaveToPdf.css'

class SaveToPdf extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false
        }
        this.imagesLoaded = 0
        this.totalImages = 0
    }
    componentDidMount() {
        const input = document.getElementById(this.props.id);
        
        // change image properties so they will work in the canvas even if they are cross origin
        this.loadImages(input);
    }

    handleSave = () => {
        const { onBeforeSave, onAfterSave, id } = this.props;

        if (onBeforeSave) {
            onBeforeSave();
        }

        this.saveToPdf(id).then(() => {
            if (onAfterSave) {
                onAfterSave();
            }
        });
    };

    loadImages = (el) => {
        var imgs = Array.from(el.getElementsByTagName("img"));
        imgs.forEach(img => {
            if (!img.src.endsWith("nocache") && img.src.startsWith('http')) {
                img.crossOrigin = "anonymous"
                img.src = img.src + "?_nocache"
            }
        })
    }

    saveToPdf = async (id) => {
        this.setState({loading: true})
        const { filename } = this.props;
        const input = document.getElementById(id);

        let pages = input.getElementsByClassName("page");
        if (pages.length == 0) {
            pages = [input]
        }
        // change image properties so they will work in the canvas even if they are cross origin
        //this.loadImages(input);
        var pdf = new jsPDF(this.props.orientation, 'pt', 'letter', true);

        for (var pageNum = 0; pageNum < pages.length; pageNum++) {
            let page = pages[pageNum];
            page.id = "page-" + pageNum;
            let canvas = await html2canvas(page,
                {
                    logging:false,
                    useCORS: true,
                    imageTimeout: 30000,
                    windowWidth: 1920,
                    scale: 1,
                    onclone: function(doc) {
                        const p = doc.getElementById(page.id);
                        p.classList.add('pdf-report');
                    }
                }
            )

            var srcImg  = canvas;
            const margin = 20;
            const pageWidth = pdf.internal.pageSize.getWidth() - margin*2;
            const pageHeight = pdf.internal.pageSize.getHeight() - margin*2;
            
            var sWidth  = 1920; 
            var sHeight = 1920*(pageHeight/pageWidth);  // make sure we keep the right aspect ratio

            for (var i = 0; i <= page.clientHeight/sHeight; i++) {
                //! This is all just html2canvas stuff
                var sX      = 0;
                var sY      = sHeight*i; // start 980 pixels down for every new page
                var dWidth  = sWidth; //sWidth
                var dHeight = sHeight; //sHeight

                let onePageCanvas = document.createElement("canvas");
                onePageCanvas.setAttribute('width', sWidth);
                onePageCanvas.setAttribute('height', sHeight);
                var ctx = onePageCanvas.getContext('2d');
                // details on this usage of this function: 
                // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Slicing
                ctx.drawImage(srcImg,sX,sY,sWidth,sHeight,0,0,dWidth,dHeight);

                var canvasDataURL = onePageCanvas.toDataURL("image/png", 1.0);

                //! If we're on anything other than the first page,
                // add another page
                if (i > 0) {
                    pdf.addPage(612, 791); //8.5" x 11" in pts (in*72)
                }
                //! now we declare that we're working on that page
                pdf.setPage(pageNum + i+1);
                pdf.addImage(canvasDataURL, 'PNG', margin, margin, pageWidth, pageHeight, pageNum,'SLOW');
            }
            if (pageNum < pages.length -1) {
                pdf.addPage(612, 791);
            }
        }
            
        //Promise.all(promises).then(v => {
            pdf.save(filename);
        //})
        //.finally(()=> {
            this.setState({loading: false})
        //});

        
    }

    saveAsPng = (uri, filename) => {

        var link = document.createElement('a');
    
        if (typeof link.download === 'string') {
    
            link.href = uri;
            link.download = filename;
    
            //Firefox requires the link to be in the body
            document.body.appendChild(link);
    
            //simulate click
            link.click();
    
            //remove the link when done
            document.body.removeChild(link);
    
        } else {
    
            window.open(uri);
    
        }
    }

    setRef = (ref) => {
        this.triggerRef = ref;
    };

    render() {
        const {
            trigger,
        } = this.props;

        const triggerButton= React.cloneElement(trigger, {
            onClick: this.handleSave,
            ref: this.setRef,
        });

        return <div>
            <Loader show={this.state.loading} message={'loading'}>
                {triggerButton}
                </Loader>
            </div>
    }
}

SaveToPdf.propTypes = {
    trigger: PropTypes.element,
    content: PropTypes.instanceOf(Element),
    id: PropTypes.string,
    orientation: PropTypes.string,
    onBeforeSave: PropTypes.func,
    onAfterSave: PropTypes.func,
    filename: PropTypes.string
};

SaveToPdf.defaultProps = {
    filename: 'download.pdf',
    orientation: 'p', // portrait
    trigger: <Button size="lg" className="ti-download" outline style={{border:0}}> PDF</Button>
};
export default SaveToPdf;