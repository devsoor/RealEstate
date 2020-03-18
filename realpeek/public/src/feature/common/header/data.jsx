import user1 from '../../../assets/images/users/1.jpg';
import user2 from '../../../assets/images/users/2.jpg';
import user3 from '../../../assets/images/users/6.jpg';
import user4 from '../../../assets/images/users/d1.jpg';

import img1 from '../../../assets/images/big/img1.jpg';
import img2 from '../../../assets/images/big/img2.jpg';
import img3 from '../../../assets/images/big/img3.jpg';

const messages = [
    {
        "id": 1,
        "image": user1,
        "status": "online",
        "title": "Cory James",
        "desc": "Just send me the report!",
        "time": "9:10 PM"
    },
    {
        "id": 2,
        "image": user2,
        "status": "busy",
        "title": "Rebecca Stenson",
        "desc": "I've found a good one",
        "time": "9:02 AM"
    },
    {
        "id": 3,
        "image": user3,
        "status": "away",
        "title": "Amy Wan",
        "desc": "I like the one in Kent",
        "time": "9:02 AM"
    },
    {
        "id": 4,
        "image": user4,
        "status": "offline",
        "title": "Dr. Jay",
        "desc": "We can meet tomorrow at 3",
        "time": "9:08 AM"
    }
];

const notifications = [
    {
        "id": 1,
        "iconclass": "fa fa-link",
        "iconbg": "danger",
        "title": "Call Amy",
        "desc": "Discuss property at 123 Main",
        "time": "9:30 AM"
    },
    {
        "id": 2,
        "iconclass": "ti-calendar text-white",
        "iconbg": "success",
        "title": "Investment seminar",
        "desc": "Meet investors at REI seminar in Tacoma",
        "time": "9:10 PM"
    },
    {
        "id": 3,
        "iconclass": "ti-settings",
        "iconbg": "info",
        "title": "Meet Cory",
        "desc": "Show house at 675 Second St.",
        "time": "9:08 AM"
    },
    {
        "id": 4,
        "iconclass": "ti-user",
        "iconbg": "primary",
        "title": "Check email",
        "desc": "Cory sent investment criteria",
        "time": "9:02 AM"
    }
]

/*--------------------------------------------------------------------------------*/
/* For Mega Menu Carousel                                                         */
/*--------------------------------------------------------------------------------*/
const items = [
    {
        src: img1,
        altText: 'Slide 1',
        caption: 'Slide 1'
    },
    {
        src: img2,
        altText: 'Slide 2',
        caption: 'Slide 2'
    },
    {
        src: img3,
        altText: 'Slide 3',
        caption: 'Slide 3'
    }
];

export { messages, notifications, items };