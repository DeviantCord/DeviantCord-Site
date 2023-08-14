import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: 'New & Improved',
        png: require('@site/static/img/new_and_improved.png').default,
        description: (
            <>
                DeviantCord 4 was overhauled to be much more reliable then DeviantCord 4. With less crashes and maintenance.
                If you had problems on DeviantCord 2 or 3, give it another try!
            </>
        ),
    },
    {
        title: 'Easy to Use',
        png: require('@site/static/img/easy_to_use.png').default,
        description: (
            <>
                DeviantCord 4 was overhauled to uses Discords Interactive components such as button
                to make it easier to use!
            </>
      ),
    },
    {
        title: 'Focus on your community!',
        png: require('@site/static/img/community.png').default,
        description: (
            <>
                DeviantCord lets you focus on your art, and we&apos;ll notify your Discord Community about new posts.
            </>
        ),
    },
    {
        title: 'Fast Notifications',
        png: require('@site/static/img/fast_notifications.png').default,
        description: (
            <>
                DeviantCord 4 introduces a faster notification system. DeviantCord delayed notifications are a thing of the past!
            </>
        ),
    },
    {
        title: 'Self Hosted Available',
        png: require('@site/static/img/self_hosted.png').default,
        description: (
            <>
                DeviantCord 4 allows for you to self host your own DeviantCord bot. It works great with CockroachDB Serverless, which offers a free tier!
            </>
        ),
    },
    {
        title: 'Free & and better then DAs offering',
        png: require('@site/static/img/free_2.png').default,
        description: (
            <>
                DeviantCord 4 is free and will never have its core features behind a paywall.
                It also has more features then DeviantArt's official Discord offering.
            </>
        ),
    },
];

/*function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}*/

function Feature({png, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={png} className={styles["dc-feature-image"]} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
